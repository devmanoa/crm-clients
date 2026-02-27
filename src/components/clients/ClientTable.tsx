import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import { formatDate } from '@/lib/utils';
import type { Client } from '@/types/client';

export default function ClientTable() {
  const navigate = useNavigate();
  const { clients, filters, setSort, selectedIds, toggleSelected, selectAll, clearSelection } = useClientStore();

  const allSelected = clients.length > 0 && clients.every((c) => selectedIds.includes(c.id));

  const handleSort = (column: string) => {
    const newOrder = filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setSort(column, newOrder);
  };

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(clients.map((c) => c.id));
    }
  };

  const getClientName = (client: Client) => {
    if (client.client_type === 'corporation') {
      return client.enseigne ? `${client.nom} (${client.enseigne})` : client.nom;
    }
    return `${client.prenom || ''} ${client.nom}`.trim();
  };

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <th
      className="px-4 py-2 text-left text-xs font-medium text-[--k-muted] uppercase tracking-wider cursor-pointer hover:text-[--k-text] select-none bg-white"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </div>
    </th>
  );

  return (
    <div className="rounded-2xl border border-[--k-border] bg-[--k-surface] shadow-sm shadow-black/[0.03] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-[--k-border]">
              <th className="px-4 py-2 w-10 bg-white">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded border-[--k-border]"
                />
              </th>
              <SortHeader column="nom" label="Client" />
              <th className="px-4 py-2 text-left text-xs font-medium text-[--k-muted] uppercase tracking-wider bg-white">Type</th>
              <SortHeader column="email" label="Email" />
              <SortHeader column="ville" label="Ville" />
              <th className="px-4 py-2 text-left text-xs font-medium text-[--k-muted] uppercase tracking-wider bg-white">Groupe</th>
              <SortHeader column="created_at" label="Création" />
              <th className="px-4 py-2 text-right text-xs font-medium text-[--k-muted] uppercase tracking-wider bg-white">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[--k-surface]">
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-t border-[--k-border] hover:bg-[--k-surface-2] cursor-pointer transition-colors"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <td className="px-4 py-1.5" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(client.id)}
                    onChange={() => toggleSelected(client.id)}
                    className="rounded border-[--k-border]"
                  />
                </td>
                <td className="px-4 py-1.5">
                  <div>
                    <p className="font-medium text-[--k-text]">{getClientName(client)}</p>
                    {client.telephone && (
                      <p className="text-[11px] text-[--k-muted]">{client.telephone}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-1.5">
                  <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${
                    client.client_type === 'corporation'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {client.client_type === 'corporation' ? 'Pro' : 'Part'}
                  </span>
                </td>
                <td className="px-4 py-1.5 text-[--k-muted]">{client.email || '-'}</td>
                <td className="px-4 py-1.5 text-[--k-muted]">
                  {client.ville ? `${client.ville}${client.departement ? ` (${client.departement})` : ''}` : '-'}
                </td>
                <td className="px-4 py-1.5 text-[--k-muted]">
                  {client.groupe_client?.nom || '-'}
                </td>
                <td className="px-4 py-1.5 text-[--k-muted]">{formatDate(client.created_at)}</td>
                <td className="px-4 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className="p-1.5 text-[--k-muted] hover:text-[--k-primary] rounded-lg hover:bg-[--k-primary-2] transition"
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/clients/${client.id}/edit`)}
                      className="p-1.5 text-[--k-muted] hover:text-[--k-warning] rounded-lg hover:bg-orange-50 transition"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Supprimer ce client ?')) {
                          useClientStore.getState().deleteClient(client.id);
                        }
                      }}
                      className="p-1.5 text-[--k-muted] hover:text-[--k-danger] rounded-lg hover:bg-red-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
