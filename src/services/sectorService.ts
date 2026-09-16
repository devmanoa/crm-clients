import api from './api';
import { API_ENDPOINTS } from '../config/api';
import type { SecteurActivite } from '../types/client';
import type { ApiResponse } from '../types/common';

/**
 * CRUD du référentiel des secteurs d'activité.
 *
 * À ne pas confondre avec clientService.getSectors(), qui tape
 * /reference-data/sectors pour alimenter les formulaires clients : ici la
 * liste porte en plus le nombre de clients rattachés (clientCount).
 */
export const sectorService = {
  async getList(): Promise<ApiResponse<SecteurActivite[]>> {
    const { data } = await api.get(API_ENDPOINTS.SECTORS.LIST);
    return data;
  },

  async create(nom: string): Promise<ApiResponse<SecteurActivite>> {
    const { data } = await api.post(API_ENDPOINTS.SECTORS.CREATE, { nom });
    return data;
  },

  async update(id: number, nom: string): Promise<ApiResponse<SecteurActivite>> {
    const { data } = await api.put(API_ENDPOINTS.SECTORS.UPDATE(id), { nom });
    return data;
  },

  async remove(id: number): Promise<ApiResponse<{ message: string }>> {
    const { data } = await api.delete(API_ENDPOINTS.SECTORS.DELETE(id));
    return data;
  },
};
