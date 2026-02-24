import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import ClientFilters from '@/components/clients/ClientFilters';
import ClientTable from '@/components/clients/ClientTable';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function ClientListPage() {
  const {
    clients, pagination, isLoading, error, selectedIds,
    fetchClients, fetchReferenceData, setPage, clearSelection, bulkAction,
  } = useClientStore();

  useEffect(() => {
    fetchClients();
    fetchReferenceData();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[--k-text]">Clients</h1>
          <p className="text-[13px] text-[--k-muted] mt-0.5">{pagination.total} clients au total</p>
        </div>
        <Link
          to="/clients/add"
          className="flex items-center gap-1.5 h-9 px-4 bg-[--k-primary] text-white text-[13px] font-medium rounded-xl hover:brightness-110 transition shadow-sm shadow-[var(--k-primary)]/20"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </Link>
      </div>

      {/* Filters */}
      <ClientFilters />

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-[--k-primary-border] bg-[--k-primary-2] px-4 py-2.5">
          <span className="text-[13px] font-medium text-[--k-primary]">
            {selectedIds.length} client(s) sélectionné(s)
          </span>
          <button
            onClick={() => {
              if (confirm(`Supprimer ${selectedIds.length} client(s) ?`)) {
                bulkAction('delete');
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-[--k-danger] bg-white rounded-lg border border-[--k-border] hover:bg-red-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer
          </button>
          <button
            onClick={clearSelection}
            className="text-[13px] text-[--k-muted] hover:text-[--k-text] ml-auto"
          >
            Désélectionner tout
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-[--k-danger]">
          {error}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : clients.length === 0 ? (
        <EmptyState
          title="Aucun client"
          description="Commencez par créer votre premier client."
        />
      ) : (
        <>
          <ClientTable />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
