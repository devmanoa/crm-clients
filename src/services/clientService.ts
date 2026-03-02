import api from './api';
import { API_ENDPOINTS } from '../config/api';
import type { Client, ClientFormData, ClientFilters, ClientContact, ClientComment, DevisRef, FactureRef, ReglementRef, GroupeClient, SourceLead, SecteurActivite, Country, ContactType } from '../types/client';
import type { PaginatedResponse, ApiResponse } from '../types/common';

export const clientService = {
  // Clients
  async getList(filters: ClientFilters): Promise<PaginatedResponse<Client>> {
    const params: Record<string, any> = {
      page: filters.page,
      limit: filters.limit,
    };
    if (filters.key) params.key = filters.key;
    if (filters.clientType) params.clientType = filters.clientType;
    if (filters.typeCommercial) params.typeCommercial = filters.typeCommercial;
    if (filters.groupeClientId) params.groupeClientId = filters.groupeClientId;
    if (filters.sourceLeadId) params.sourceLeadId = filters.sourceLeadId;
    if (filters.departement) params.departement = filters.departement;
    if (filters.sectorIds?.length) params.sectorIds = filters.sectorIds.join(',');
    if (filters.isQualifie !== undefined) params.isQualifie = filters.isQualifie;
    if (filters.hasAddress !== undefined) params.hasAddress = filters.hasAddress;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const { data } = await api.get(API_ENDPOINTS.CLIENTS.LIST, { params });
    return data;
  },

  async getById(id: number): Promise<ApiResponse<Client>> {
    const { data } = await api.get(API_ENDPOINTS.CLIENTS.GET(id));
    return data;
  },

  async create(formData: ClientFormData): Promise<ApiResponse<Client>> {
    const { data } = await api.post(API_ENDPOINTS.CLIENTS.CREATE, formData);
    return data;
  },

  async update(id: number, formData: ClientFormData): Promise<ApiResponse<Client>> {
    const { data } = await api.put(API_ENDPOINTS.CLIENTS.UPDATE(id), formData);
    return data;
  },

  async delete(id: number): Promise<ApiResponse<{ message: string }>> {
    const { data } = await api.delete(API_ENDPOINTS.CLIENTS.DELETE(id));
    return data;
  },

  async search(query: string, limit = 10): Promise<ApiResponse<Client[]>> {
    const { data } = await api.get(API_ENDPOINTS.CLIENTS.SEARCH, {
      params: { q: query, limit },
    });
    return data;
  },

  async bulkAction(action: string, clientIds: number[], sectorIds?: number[]): Promise<ApiResponse<{ message: string }>> {
    const { data } = await api.post(API_ENDPOINTS.CLIENTS.BULK_ACTION, {
      action,
      clientIds,
      sectorIds,
    });
    return data;
  },

  // Contacts
  async getContacts(clientId: number): Promise<ApiResponse<ClientContact[]>> {
    const { data } = await api.get(API_ENDPOINTS.CLIENTS.CONTACTS(clientId));
    return data;
  },

  async createContact(clientId: number, contact: Partial<ClientContact>): Promise<ApiResponse<ClientContact>> {
    const { data } = await api.post(API_ENDPOINTS.CLIENTS.CONTACTS(clientId), contact);
    return data;
  },

  async updateContact(clientId: number, id: number, contact: Partial<ClientContact>): Promise<ApiResponse<ClientContact>> {
    const { data } = await api.put(API_ENDPOINTS.CLIENTS.CONTACT(clientId, id), contact);
    return data;
  },

  async deleteContact(clientId: number, id: number): Promise<ApiResponse<{ message: string }>> {
    const { data } = await api.delete(API_ENDPOINTS.CLIENTS.CONTACT(clientId, id));
    return data;
  },

  // Comments
  async getComments(clientId: number, page = 1, limit = 10): Promise<PaginatedResponse<ClientComment>> {
    const { data } = await api.get(API_ENDPOINTS.CLIENTS.COMMENTS(clientId), {
      params: { page, limit },
    });
    return data;
  },

  async createComment(clientId: number, contenu: string, files?: File[]): Promise<ApiResponse<ClientComment>> {
    const formData = new FormData();
    formData.append('contenu', contenu);
    if (files) {
      files.forEach((file) => formData.append('files', file));
    }
    const { data } = await api.post(API_ENDPOINTS.CLIENTS.COMMENTS(clientId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteComment(clientId: number, id: number): Promise<ApiResponse<{ message: string }>> {
    const { data } = await api.delete(API_ENDPOINTS.CLIENTS.COMMENT(clientId, id));
    return data;
  },

  // Devis
  async getDevis(clientId: number): Promise<ApiResponse<DevisRef[]>> {
    const { data } = await api.get(API_ENDPOINTS.CLIENTS.DEVIS(clientId));
    return data;
  },

  async createDevis(clientId: number, devis: Partial<DevisRef>): Promise<ApiResponse<DevisRef>> {
    const { data } = await api.post(API_ENDPOINTS.CLIENTS.DEVIS(clientId), devis);
    return data;
  },

  async updateDevis(clientId: number, id: number, devis: Partial<DevisRef>): Promise<ApiResponse<DevisRef>> {
    const { data } = await api.put(API_ENDPOINTS.CLIENTS.DEVIS_ONE(clientId, id), devis);
    return data;
  },

  async deleteDevis(clientId: number, id: number): Promise<ApiResponse<{ message: string }>> {
    const { data } = await api.delete(API_ENDPOINTS.CLIENTS.DEVIS_ONE(clientId, id));
    return data;
  },

  // Factures
  async getFactures(clientId: number): Promise<ApiResponse<FactureRef[]>> {
    const { data } = await api.get(API_ENDPOINTS.CLIENTS.FACTURES(clientId));
    return data;
  },

  async createFacture(clientId: number, facture: Partial<FactureRef>): Promise<ApiResponse<FactureRef>> {
    const { data } = await api.post(API_ENDPOINTS.CLIENTS.FACTURES(clientId), facture);
    return data;
  },

  async updateFacture(clientId: number, id: number, facture: Partial<FactureRef>): Promise<ApiResponse<FactureRef>> {
    const { data } = await api.put(API_ENDPOINTS.CLIENTS.FACTURES_ONE(clientId, id), facture);
    return data;
  },

  async deleteFacture(clientId: number, id: number): Promise<ApiResponse<{ message: string }>> {
    const { data } = await api.delete(API_ENDPOINTS.CLIENTS.FACTURES_ONE(clientId, id));
    return data;
  },

  // Reglements
  async getReglements(clientId: number): Promise<ApiResponse<ReglementRef[]>> {
    const { data } = await api.get(API_ENDPOINTS.CLIENTS.REGLEMENTS(clientId));
    return data;
  },

  async createReglement(clientId: number, reglement: Partial<ReglementRef>): Promise<ApiResponse<ReglementRef>> {
    const { data } = await api.post(API_ENDPOINTS.CLIENTS.REGLEMENTS(clientId), reglement);
    return data;
  },

  async updateReglement(clientId: number, id: number, reglement: Partial<ReglementRef>): Promise<ApiResponse<ReglementRef>> {
    const { data } = await api.put(API_ENDPOINTS.CLIENTS.REGLEMENTS_ONE(clientId, id), reglement);
    return data;
  },

  async deleteReglement(clientId: number, id: number): Promise<ApiResponse<{ message: string }>> {
    const { data } = await api.delete(API_ENDPOINTS.CLIENTS.REGLEMENTS_ONE(clientId, id));
    return data;
  },

  // Reference data
  async getGroups(): Promise<ApiResponse<GroupeClient[]>> {
    const { data } = await api.get(API_ENDPOINTS.REFERENCE_DATA.GROUPS);
    return data;
  },

  async getSources(): Promise<ApiResponse<SourceLead[]>> {
    const { data } = await api.get(API_ENDPOINTS.REFERENCE_DATA.SOURCES);
    return data;
  },

  async getSectors(): Promise<ApiResponse<SecteurActivite[]>> {
    const { data } = await api.get(API_ENDPOINTS.REFERENCE_DATA.SECTORS);
    return data;
  },

  async getCountries(): Promise<ApiResponse<Country[]>> {
    const { data } = await api.get(API_ENDPOINTS.REFERENCE_DATA.COUNTRIES);
    return data;
  },

  async getContactTypes(): Promise<ApiResponse<ContactType[]>> {
    const { data } = await api.get(API_ENDPOINTS.REFERENCE_DATA.CONTACT_TYPES);
    return data;
  },
};
