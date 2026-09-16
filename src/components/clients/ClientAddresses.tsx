import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star, Check, X } from 'lucide-react';
import { clientService } from '@/services/clientService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import AddressAutocomplete from '@/components/common/AddressAutocomplete';
import { ADDRESS_LABEL_SUGGESTIONS, type ClientAddress } from '@/types/client';

/** Rôles autorisés à écrire, alignés sur WRITE_ROLES côté API. */
const WRITE_ROLES = ['admin', 'user'];

const LABEL_DATALIST_ID = 'address-label-suggestions';

type Draft = {
  label: string;
  adresse: string;
  adresse2: string;
  cp: string;
  ville: string;
  isPrimary: boolean;
};

const emptyDraft: Draft = {
  label: '',
  adresse: '',
  adresse2: '',
  cp: '',
  ville: '',
  isPrimary: false,
};

function toDraft(a: ClientAddress): Draft {
  return {
    label: a.label || '',
    adresse: a.adresse || '',
    adresse2: a.adresse2 || '',
    cp: a.cp || '',
    ville: a.ville || '',
    isPrimary: a.isPrimary,
  };
}

function apiError(err: unknown, fallback: string): string {
  const res = (err as { response?: { data?: { error?: string } } })?.response;
  return res?.data?.error || fallback;
}

/** Une adresse sans rue ni ville n'a rien à afficher : on évite une ligne vide. */
function isEmptyDraft(d: Draft): boolean {
  return !d.adresse.trim() && !d.ville.trim() && !d.cp.trim();
}

interface Props {
  clientId: number;
  /** Adresses déjà chargées avec la fiche client, pour éviter un appel au montage. */
  initialAddresses?: ClientAddress[];
  onCountChange?: (count: number) => void;
}

export default function ClientAddresses({ clientId, initialAddresses, onCountChange }: Props) {
  const { hasRole } = useAuth();
  const canWrite = WRITE_ROLES.some((role) => hasRole(role));

  const [addresses, setAddresses] = useState<ClientAddress[]>(initialAddresses ?? []);
  const [isLoading, setIsLoading] = useState(!initialAddresses);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<ClientAddress | null>(null);

  function sync(list: ClientAddress[]) {
    setAddresses(list);
    onCountChange?.(list.length);
  }

  async function reload() {
    try {
      const res = await clientService.getAddresses(clientId);
      sync(res.data);
    } catch (err) {
      setError(apiError(err, 'Impossible de charger les adresses'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!initialAddresses) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  function startCreate() {
    setEditingId('new');
    // La toute première adresse sera principale côté serveur de toute façon.
    setDraft({ ...emptyDraft, isPrimary: addresses.length === 0 });
    setError(null);
  }

  function startEdit(a: ClientAddress) {
    setEditingId(a.id);
    setDraft(toDraft(a));
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function save() {
    if (isSaving || isEmptyDraft(draft)) return;
    setIsSaving(true);
    setError(null);

    const payload = {
      label: draft.label.trim() || null,
      adresse: draft.adresse.trim() || null,
      adresse2: draft.adresse2.trim() || null,
      cp: draft.cp.trim() || null,
      ville: draft.ville.trim() || null,
      isPrimary: draft.isPrimary,
    };

    try {
      if (editingId === 'new') {
        await clientService.createAddress(clientId, payload);
      } else if (typeof editingId === 'number') {
        await clientService.updateAddress(clientId, editingId, payload);
      }
      // On recharge : le serveur peut avoir basculé la principale précédente.
      await reload();
      cancel();
    } catch (err) {
      setError(apiError(err, "Impossible d'enregistrer l'adresse"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    setError(null);
    try {
      await clientService.deleteAddress(clientId, target.id);
      await reload();
    } catch (err) {
      setError(apiError(err, "Impossible de supprimer l'adresse"));
    }
  }

  async function setPrimary(a: ClientAddress) {
    if (a.isPrimary) return;
    setError(null);
    try {
      await clientService.updateAddress(clientId, a.id, { ...toDraft(a), isPrimary: true });
      await reload();
    } catch (err) {
      setError(apiError(err, 'Impossible de définir cette adresse comme principale'));
    }
  }

  const field = 'w-full h-8 px-2 text-[13px] bg-[--k-surface] border border-[--k-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--k-primary]/30';

  function renderForm() {
    return (
      <div className="rounded-xl border border-[--k-primary-border] bg-[--k-primary-2]/30 p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] text-[--k-muted] mb-1">Nom de l'adresse</label>
            <input
              className={field}
              list={LABEL_DATALIST_ID}
              value={draft.label}
              maxLength={100}
              placeholder="Principale, Bureau…"
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-[--k-muted] mb-1">Adresse</label>
            <AddressAutocomplete
              value={draft.adresse}
              onChange={(v) => setDraft((d) => ({ ...d, adresse: v }))}
              onPlaceSelected={(parsed) =>
                setDraft((d) => ({
                  ...d,
                  adresse: parsed.adresse,
                  cp: parsed.cp || d.cp,
                  ville: parsed.ville || d.ville,
                }))
              }
              placeholder="Commencez à taper l'adresse…"
              className={field}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-3">
            <label className="block text-[11px] text-[--k-muted] mb-1">Complément</label>
            <input
              className={field}
              value={draft.adresse2}
              maxLength={255}
              onChange={(e) => setDraft({ ...draft, adresse2: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] text-[--k-muted] mb-1">Code postal</label>
            <input
              className={field}
              value={draft.cp}
              maxLength={20}
              onChange={(e) => setDraft({ ...draft, cp: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-[--k-muted] mb-1">Ville</label>
            <input
              className={field}
              value={draft.ville}
              maxLength={120}
              onChange={(e) => setDraft({ ...draft, ville: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-[12px] text-[--k-text] cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isPrimary}
              disabled={addresses.length === 0}
              onChange={(e) => setDraft({ ...draft, isPrimary: e.target.checked })}
              className="rounded border-[--k-border]"
            />
            Adresse principale
          </label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={cancel}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-[--k-muted] bg-[--k-surface-2] rounded-lg hover:brightness-95 transition"
            >
              <X className="w-3.5 h-3.5" />
              Annuler
            </button>
            <button
              onClick={save}
              disabled={isSaving || isEmptyDraft(draft)}
              title={isEmptyDraft(draft) ? 'Renseignez au moins une rue, un code postal ou une ville' : undefined}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-white bg-[--k-primary] rounded-lg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <datalist id={LABEL_DATALIST_ID}>
        {ADDRESS_LABEL_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-[--k-danger]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {addresses.length === 0 && editingId !== 'new' && (
            <p className="text-[13px] text-[--k-muted]">Aucune adresse pour ce client.</p>
          )}

          <div className="space-y-2">
            {addresses.map((a) =>
              editingId === a.id ? (
                <div key={a.id}>{renderForm()}</div>
              ) : (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[--k-border] bg-[--k-surface-2]/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium text-[--k-text]">
                        {a.label || 'Adresse'}
                      </span>
                      {a.isPrimary && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          Principale
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[--k-muted] mt-0.5">
                      {[a.adresse, a.adresse2, [a.cp, a.ville].filter(Boolean).join(' ')]
                        .filter(Boolean)
                        .join(', ') || '--'}
                    </p>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {!a.isPrimary && (
                        <button
                          onClick={() => setPrimary(a)}
                          title="Définir comme principale"
                          className="p-1.5 text-[--k-muted] rounded-lg hover:bg-[--k-surface-2] hover:text-[--k-text] transition"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(a)}
                        title="Modifier"
                        className="p-1.5 text-[--k-muted] rounded-lg hover:bg-[--k-surface-2] hover:text-[--k-text] transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(a)}
                        title="Supprimer"
                        className="p-1.5 text-[--k-muted] rounded-lg hover:bg-red-50 hover:text-[--k-danger] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {editingId === 'new' && renderForm()}

          {canWrite && editingId === null && (
            <button
              onClick={startCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[--k-primary] bg-[--k-primary-2] rounded-lg hover:brightness-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Ajouter une adresse
            </button>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Supprimer cette adresse ?"
        message={`« ${pendingDelete?.label || 'Adresse'} » sera supprimée. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
