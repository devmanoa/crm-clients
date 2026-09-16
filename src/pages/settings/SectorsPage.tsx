import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Search } from 'lucide-react';
import { sectorService } from '@/services/sectorService';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { SecteurActivite } from '@/types/client';

/** Rôles autorisés à écrire, alignés sur WRITE_ROLES côté API. */
const WRITE_ROLES = ['admin', 'user'];

/** Remonte le message d'erreur de l'API plutôt qu'un « Erreur » générique :
 *  c'est lui qui explique pourquoi une suppression est refusée. */
function apiError(err: unknown, fallback: string): string {
  const res = (err as { response?: { data?: { error?: string } } })?.response;
  return res?.data?.error || fallback;
}

export default function SectorsPage() {
  const { hasRole } = useAuth();
  const canWrite = WRITE_ROLES.some((role) => hasRole(role));

  const [sectors, setSectors] = useState<SecteurActivite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<SecteurActivite | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await sectorService.getList();
      setSectors(res.data);
    } catch (err) {
      setError(apiError(err, 'Impossible de charger les secteurs'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sectors;
    return sectors.filter((s) => s.nom.toLowerCase().includes(q));
  }, [sectors, search]);

  const usedCount = useMemo(() => sectors.filter((s) => (s.clientCount ?? 0) > 0).length, [sectors]);

  async function handleCreate() {
    const nom = newName.trim();
    if (nom.length < 2 || isCreating) return;

    setIsCreating(true);
    setError(null);
    try {
      const res = await sectorService.create(nom);
      // Ré-trie localement pour garder l'ordre alphabétique de l'API.
      setSectors((prev) => [...prev, res.data].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')));
      setNewName('');
    } catch (err) {
      setError(apiError(err, 'Impossible de créer le secteur'));
    } finally {
      setIsCreating(false);
    }
  }

  function startEdit(sector: SecteurActivite) {
    setEditingId(sector.id);
    setEditingName(sector.nom);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  async function handleUpdate(id: number) {
    const nom = editingName.trim();
    if (nom.length < 2 || isSaving) return;

    const current = sectors.find((s) => s.id === id);
    if (current && current.nom === nom) {
      cancelEdit();
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const res = await sectorService.update(id, nom);
      setSectors((prev) =>
        prev
          .map((s) => (s.id === id ? { ...s, nom: res.data.nom } : s))
          .sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
      );
      cancelEdit();
    } catch (err) {
      setError(apiError(err, 'Impossible de renommer le secteur'));
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
      await sectorService.remove(target.id);
      setSectors((prev) => prev.filter((s) => s.id !== target.id));
    } catch (err) {
      setError(apiError(err, 'Impossible de supprimer le secteur'));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-[--k-text]">Secteurs d'activité</h1>
        <p className="text-[13px] text-[--k-muted] mt-0.5">
          {sectors.length} secteur(s) — {usedCount} rattaché(s) à au moins un client
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-[--k-danger]">
          {error}
        </div>
      )}

      {canWrite && (
        <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nom du nouveau secteur"
              maxLength={255}
              className="flex-1 min-w-[220px] h-9 px-3 text-[13px] bg-[--k-surface-2] border border-[--k-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--k-primary]/30"
            />
            <button
              onClick={handleCreate}
              disabled={newName.trim().length < 2 || isCreating}
              className="flex items-center gap-1.5 h-9 px-4 bg-[--k-primary] text-white text-[13px] font-medium rounded-xl hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
      )}

      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] overflow-hidden">
        <div className="p-4 border-b border-[--k-border]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--k-muted]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un secteur"
              className="w-full h-9 pl-9 pr-3 text-[13px] bg-[--k-surface-2] border border-[--k-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--k-primary]/30"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingSpinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? 'Aucun secteur trouvé' : 'Aucun secteur'}
            description={
              search
                ? 'Aucun secteur ne correspond à cette recherche.'
                : "Le référentiel des secteurs d'activité est vide."
            }
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[--k-border] bg-[--k-surface-2]">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[--k-muted]">
                  Nom
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[--k-muted] w-32">
                  Clients
                </th>
                {canWrite && <th className="px-4 py-2.5 w-24" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sector) => {
                const isEditing = editingId === sector.id;
                const count = sector.clientCount ?? 0;

                return (
                  <tr
                    key={sector.id}
                    className="border-b border-[--k-border] last:border-0 hover:bg-[--k-surface-2]/50 transition"
                  >
                    <td className="px-4 py-2.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(sector.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          maxLength={255}
                          autoFocus
                          className="w-full h-8 px-2 text-[13px] bg-[--k-surface] border border-[--k-primary-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--k-primary]/30"
                        />
                      ) : (
                        <span className="text-[13px] text-[--k-text]">{sector.nom}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[12px] font-medium ${
                          count > 0
                            ? 'bg-[--k-primary-2] text-[--k-primary]'
                            : 'bg-[--k-surface-2] text-[--k-muted]'
                        }`}
                      >
                        {count}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdate(sector.id)}
                                disabled={editingName.trim().length < 2 || isSaving}
                                title="Enregistrer"
                                className="p-1.5 text-[--k-primary] rounded-lg hover:bg-[--k-primary-2] transition disabled:opacity-40"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                title="Annuler"
                                className="p-1.5 text-[--k-muted] rounded-lg hover:bg-[--k-surface-2] transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(sector)}
                                title="Renommer"
                                className="p-1.5 text-[--k-muted] rounded-lg hover:bg-[--k-surface-2] hover:text-[--k-text] transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setPendingDelete(sector)}
                                disabled={count > 0}
                                title={
                                  count > 0
                                    ? `Rattaché à ${count} client(s) : détachez-les d'abord`
                                    : 'Supprimer'
                                }
                                className="p-1.5 text-[--k-muted] rounded-lg hover:bg-red-50 hover:text-[--k-danger] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[--k-muted]"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Supprimer ce secteur ?"
        message={`« ${pendingDelete?.nom ?? ''} » sera retiré du référentiel. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
