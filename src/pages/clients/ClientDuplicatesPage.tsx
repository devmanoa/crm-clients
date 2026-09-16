import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Merge, Mail, Building2, AlertTriangle, ExternalLink } from 'lucide-react';
import { clientService } from '@/services/clientService';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateShort } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import Pagination from '@/components/common/Pagination';
import type { DuplicatePair, DuplicateSide, MergePreview } from '@/types/client';

/** Rôles autorisés à écrire, alignés sur WRITE_ROLES côté API. */
const WRITE_ROLES = ['admin', 'user'];

const MOVE_LABELS: Record<string, string> = {
  contacts: 'contact(s)',
  addresses: 'adresse(s)',
  comments: 'commentaire(s)',
  sectors: "secteur(s) d'activité",
  devis: 'devis',
  factures: 'facture(s)',
  avoirs: 'avoir(s)',
  reglements: 'règlement(s)',
  opportunities: 'opportunité(s)',
};

function apiError(err: unknown, fallback: string): string {
  const res = (err as { response?: { data?: { error?: string } } })?.response;
  return res?.data?.error || fallback;
}

function sideName(c: DuplicateSide): string {
  if (c.clientType === 'corporation') {
    return c.enseigne ? `${c.nom} — ${c.enseigne}` : c.nom;
  }
  return [c.prenom, c.nom].filter(Boolean).join(' ');
}

/** Carte d'un des deux clients, sélectionnable comme client principal. */
function SideCard({
  client,
  selected,
  onSelect,
  disabled,
}: {
  client: DuplicateSide;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex-1 min-w-0 text-left rounded-xl border p-3 transition ${
        selected
          ? 'border-[--k-primary-border] bg-[--k-primary-2]/40 ring-1 ring-[--k-primary]/20'
          : 'border-[--k-border] bg-[--k-surface-2]/40 hover:brightness-95'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[--k-text] truncate">{sideName(client)}</p>
          <p className="text-[11px] text-[--k-muted] mt-0.5">#{client.id}</p>
        </div>
        {selected && (
          <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[--k-primary] text-white rounded-full">
            Principal
          </span>
        )}
      </div>
      <dl className="mt-2 space-y-0.5 text-[12px] text-[--k-muted]">
        <div className="truncate">{client.email || '—'}</div>
        <div className="truncate">{client.telephone || '—'}</div>
        <div className="truncate">{client.ville || '—'}</div>
        <div>Créé le {formatDateShort(client.createdAt)}</div>
      </dl>
    </button>
  );
}

export default function ClientDuplicatesPage() {
  const { hasRole } = useAuth();
  const canWrite = WRITE_ROLES.some((role) => hasRole(role));

  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Client retenu comme principal, par paire. Défaut : le plus ancien. */
  const [primaryChoice, setPrimaryChoice] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [merged, setMerged] = useState<string | null>(null);

  const pairKey = (p: DuplicatePair) => `${p.left.id}-${p.right.id}`;

  async function load(targetPage = page) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await clientService.getDuplicates(targetPage, 20);
      setPairs(res.data);
      setPagination(res.pagination);
      // Par défaut, le plus ancien des deux est le client principal : c'est
      // celui qui porte le plus probablement l'historique.
      const defaults: Record<string, number> = {};
      for (const p of res.data) {
        defaults[`${p.left.id}-${p.right.id}`] =
          new Date(p.left.createdAt) <= new Date(p.right.createdAt) ? p.left.id : p.right.id;
      }
      setPrimaryChoice(defaults);
    } catch (err) {
      setError(apiError(err, 'Impossible de charger les doublons'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function openMerge(pair: DuplicatePair) {
    const key = pairKey(pair);
    const primaryId = primaryChoice[key] ?? pair.left.id;
    const duplicateId = primaryId === pair.left.id ? pair.right.id : pair.left.id;

    setIsPreviewing(true);
    setError(null);
    try {
      const res = await clientService.getMergePreview(primaryId, duplicateId);
      setPreview(res.data);
    } catch (err) {
      setError(apiError(err, 'Impossible de préparer la fusion'));
    } finally {
      setIsPreviewing(false);
    }
  }

  async function confirmMerge() {
    if (!preview || isMerging) return;
    setIsMerging(true);
    setError(null);
    try {
      const res = await clientService.merge(preview.primary.id, preview.duplicate.id);
      setMerged(
        `${res.data.duplicate.label} a été fusionné dans ${res.data.primary.label} — ${res.data.total} élément(s) déplacé(s).`,
      );
      setPreview(null);
      await load(page);
    } catch (err) {
      setError(apiError(err, 'La fusion a échoué'));
    } finally {
      setIsMerging(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[--k-text]">Doublons</h1>
        <p className="text-[13px] text-[--k-muted] mt-0.5">
          {pagination.total} paire(s) détectée(s) — même email, ou même nom entre deux professionnels
        </p>
      </div>

      {merged && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
          <span className="flex-1">{merged}</span>
          <button onClick={() => setMerged(null)} className="text-emerald-700 hover:underline shrink-0">
            Fermer
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-[--k-danger]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : pairs.length === 0 ? (
        <div className="bg-[--k-surface] rounded-2xl border border-[--k-border]">
          <EmptyState
            title="Aucun doublon"
            description="Aucune paire de clients ne partage un email ni un nom d'entreprise."
          />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pairs.map((pair) => {
              const key = pairKey(pair);
              const primaryId = primaryChoice[key] ?? pair.left.id;

              return (
                <div
                  key={key}
                  className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[--k-surface-2] text-[--k-muted] rounded-full">
                      {pair.reason === 'email' ? (
                        <>
                          <Mail className="w-3 h-3" /> Même email
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3" /> Même nom
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-[--k-muted]">
                      Choisissez le client à conserver
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch gap-2">
                    <SideCard
                      client={pair.left}
                      selected={primaryId === pair.left.id}
                      onSelect={() => setPrimaryChoice((p) => ({ ...p, [key]: pair.left.id }))}
                      disabled={!canWrite}
                    />
                    <div className="flex sm:flex-col items-center justify-center text-[--k-muted] px-1">
                      <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
                    </div>
                    <SideCard
                      client={pair.right}
                      selected={primaryId === pair.right.id}
                      onSelect={() => setPrimaryChoice((p) => ({ ...p, [key]: pair.right.id }))}
                      disabled={!canWrite}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[--k-border]">
                    <div className="flex items-center gap-3 text-[12px]">
                      <Link
                        to={`/clients/${pair.left.id}`}
                        className="inline-flex items-center gap-1 text-[--k-primary] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Fiche #{pair.left.id}
                      </Link>
                      <Link
                        to={`/clients/${pair.right.id}`}
                        className="inline-flex items-center gap-1 text-[--k-primary] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Fiche #{pair.right.id}
                      </Link>
                    </div>

                    {canWrite && (
                      <button
                        onClick={() => openMerge(pair)}
                        disabled={isPreviewing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-[--k-primary] rounded-lg hover:brightness-110 transition disabled:opacity-40"
                      >
                        <Merge className="w-3.5 h-3.5" />
                        Fusionner
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      {/* Confirmation : on montre exactement ce qui va bouger avant d'écrire. */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => !isMerging && setPreview(null)} />
          <div className="relative bg-[--k-surface] rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-[--k-text]">Confirmer la fusion</h3>
                <p className="mt-1 text-[13px] text-[--k-muted]">
                  Toutes les données de{' '}
                  <strong className="text-[--k-text]">{preview.duplicate.label}</strong> seront
                  rattachées à <strong className="text-[--k-text]">{preview.primary.label}</strong>,
                  puis la fiche en double sera supprimée.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[--k-border] bg-[--k-surface-2]/40 p-3">
              {preview.total === 0 ? (
                <p className="text-[13px] text-[--k-muted]">
                  Le doublon ne porte aucune donnée : seule la fiche sera supprimée.
                </p>
              ) : (
                <ul className="space-y-1 text-[13px] text-[--k-text]">
                  {Object.entries(preview.moves)
                    .filter(([, count]) => count > 0)
                    .map(([key, count]) => (
                      <li key={key} className="flex items-center justify-between">
                        <span className="text-[--k-muted]">{MOVE_LABELS[key] ?? key}</span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <p className="mt-3 text-[12px] text-[--k-muted]">
              La fiche en double est marquée supprimée, pas effacée : elle reste récupérable en base.
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setPreview(null)}
                disabled={isMerging}
                className="px-4 py-2 text-sm font-medium text-[--k-muted] bg-[--k-surface-2] rounded-xl hover:brightness-95 transition disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={confirmMerge}
                disabled={isMerging}
                className="px-4 py-2 text-sm font-medium text-white bg-[--k-primary] rounded-xl hover:brightness-110 transition disabled:opacity-40"
              >
                {isMerging ? 'Fusion…' : 'Fusionner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
