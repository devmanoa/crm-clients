import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';
import { useClientStore } from '@/stores/clientStore';
import type { ClientType, TypeCommercial } from '@/types/client';

export default function ClientFilters() {
  const { filters, setFilters, resetFilters, groupes, sources, secteurs } = useClientStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchKey, setSearchKey] = useState(filters.key || '');

  const handleSearch = () => {
    setFilters({ key: searchKey || undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="rounded-2xl border border-[--k-border] bg-[--k-surface] shadow-sm shadow-black/[0.03] p-4 space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--k-muted]" />
          <input
            type="text"
            placeholder="Rechercher par nom, enseigne, email..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field pl-10"
          />
        </div>
        <button
          onClick={handleSearch}
          className="h-9 px-4 bg-[--k-primary] text-white text-[13px] font-medium rounded-xl hover:brightness-110 transition shadow-sm shadow-[var(--k-primary)]/20"
        >
          Rechercher
        </button>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium rounded-xl border transition ${
            showAdvanced
              ? 'bg-[--k-primary-2] text-[--k-primary] border-[--k-primary-border]'
              : 'text-[--k-muted] border-[--k-border] hover:bg-[--k-surface-2]'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
        </button>
        {(filters.key || filters.clientType || filters.groupeClientId) && (
          <button
            onClick={() => {
              setSearchKey('');
              resetFilters();
            }}
            className="flex items-center gap-1 h-9 px-3 text-[13px] text-[--k-danger] hover:bg-red-50 rounded-xl transition"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[--k-border]">
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Type</label>
            <select
              value={filters.clientType || ''}
              onChange={(e) => setFilters({ clientType: (e.target.value as ClientType) || undefined })}
              className="input-field"
            >
              <option value="">Tous</option>
              <option value="corporation">Professionnel</option>
              <option value="person">Particulier</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Commercial</label>
            <select
              value={filters.typeCommercial || ''}
              onChange={(e) => setFilters({ typeCommercial: (e.target.value as TypeCommercial) || undefined })}
              className="input-field"
            >
              <option value="">Tous</option>
              <option value="client">Client</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Groupe</label>
            <select
              value={filters.groupeClientId || ''}
              onChange={(e) => setFilters({ groupeClientId: e.target.value ? parseInt(e.target.value) : undefined })}
              className="input-field"
            >
              <option value="">Tous</option>
              {groupes.map((g) => (
                <option key={g.id} value={g.id}>{g.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Source</label>
            <select
              value={filters.sourceLeadId || ''}
              onChange={(e) => setFilters({ sourceLeadId: e.target.value ? parseInt(e.target.value) : undefined })}
              className="input-field"
            >
              <option value="">Toutes</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Département</label>
            <input
              type="text"
              placeholder="Ex: 75"
              value={filters.departement || ''}
              onChange={(e) => setFilters({ departement: e.target.value || undefined })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Secteur</label>
            <select
              value={filters.sectorIds?.[0] || ''}
              onChange={(e) => setFilters({ sectorIds: e.target.value ? [parseInt(e.target.value)] : undefined })}
              className="input-field"
            >
              <option value="">Tous</option>
              {secteurs.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Du</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Au</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ dateTo: e.target.value || undefined })}
              className="input-field"
            />
          </div>
        </div>
      )}
    </div>
  );
}
