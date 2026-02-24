import { create } from 'zustand';
import { clientService } from '../services/clientService';
import type { Client, ClientFilters, GroupeClient, SourceLead, SecteurActivite, Country, ContactType } from '../types/client';
import type { Pagination } from '../types/common';

interface ClientState {
  // List
  clients: Client[];
  pagination: Pagination;
  filters: ClientFilters;
  isLoading: boolean;
  error: string | null;

  // Detail
  currentClient: Client | null;
  isLoadingDetail: boolean;

  // Reference data
  groupes: GroupeClient[];
  sources: SourceLead[];
  secteurs: SecteurActivite[];
  countries: Country[];
  contactTypes: ContactType[];
  isLoadingRefData: boolean;

  // Selected (for bulk actions)
  selectedIds: number[];

  // Actions
  fetchClients: () => Promise<void>;
  fetchClientById: (id: number) => Promise<void>;
  setFilters: (filters: Partial<ClientFilters>) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  toggleSelected: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
  deleteClient: (id: number) => Promise<void>;
  bulkAction: (action: string, sectorIds?: number[]) => Promise<void>;
  fetchReferenceData: () => Promise<void>;
  clearCurrentClient: () => void;
}

const defaultFilters: ClientFilters = {
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  filters: { ...defaultFilters },
  isLoading: false,
  error: null,

  currentClient: null,
  isLoadingDetail: false,

  groupes: [],
  sources: [],
  secteurs: [],
  countries: [],
  contactTypes: [],
  isLoadingRefData: false,

  selectedIds: [],

  fetchClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await clientService.getList(get().filters);
      set({
        clients: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || 'Erreur lors du chargement des clients',
        isLoading: false,
      });
    }
  },

  fetchClientById: async (id: number) => {
    set({ isLoadingDetail: true, error: null });
    try {
      const response = await clientService.getById(id);
      set({ currentClient: response.data, isLoadingDetail: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.error || 'Erreur lors du chargement du client',
        isLoadingDetail: false,
      });
    }
  },

  setFilters: (newFilters: Partial<ClientFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    }));
    get().fetchClients();
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().fetchClients();
  },

  setPage: (page: number) => {
    set((state) => ({
      filters: { ...state.filters, page },
    }));
    get().fetchClients();
  },

  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => {
    set((state) => ({
      filters: { ...state.filters, sortBy, sortOrder, page: 1 },
    }));
    get().fetchClients();
  },

  toggleSelected: (id: number) => {
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((i) => i !== id)
        : [...state.selectedIds, id],
    }));
  },

  selectAll: (ids: number[]) => {
    set({ selectedIds: ids });
  },

  clearSelection: () => {
    set({ selectedIds: [] });
  },

  deleteClient: async (id: number) => {
    try {
      await clientService.delete(id);
      get().fetchClients();
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Erreur lors de la suppression' });
    }
  },

  bulkAction: async (action: string, sectorIds?: number[]) => {
    const { selectedIds } = get();
    try {
      await clientService.bulkAction(action, selectedIds, sectorIds);
      set({ selectedIds: [] });
      get().fetchClients();
    } catch (err: any) {
      set({ error: err.response?.data?.error || "Erreur lors de l'action" });
    }
  },

  fetchReferenceData: async () => {
    set({ isLoadingRefData: true });
    try {
      const [groupesRes, sourcesRes, secteursRes, countriesRes, contactTypesRes] = await Promise.all([
        clientService.getGroups(),
        clientService.getSources(),
        clientService.getSectors(),
        clientService.getCountries(),
        clientService.getContactTypes(),
      ]);
      set({
        groupes: groupesRes.data,
        sources: sourcesRes.data,
        secteurs: secteursRes.data,
        countries: countriesRes.data,
        contactTypes: contactTypesRes.data,
        isLoadingRefData: false,
      });
    } catch {
      set({ isLoadingRefData: false });
    }
  },

  clearCurrentClient: () => {
    set({ currentClient: null });
  },
}));
