import axios from 'axios';

const crmApi = axios.create({
  baseURL: import.meta.env.VITE_CRM_API_URL || 'https://crm.konitys.fr/api-v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Types pour les données de création de devis
export interface ModelDevis {
  id: number;
  model_name: string;
  modele_devis_categories_id: number | null;
  modele_devis_sous_categories_id: number | null;
}

export interface ModelCategory {
  id: number;
  name: string;
}

export interface ModelSousCategory {
  id: number;
  name: string;
  modele_devis_categories_id: number;
}

export interface TypeDoc {
  id: number;
  nom: string;
}

export interface CategorieTarifaire {
  value: string;
  label: string;
}

export interface DevisCreationData {
  modelDevis: ModelDevis[];
  modelCategories: ModelCategory[];
  modelSousCategories: ModelSousCategory[];
  typeDocs: TypeDoc[];
  categorieTarifaires: CategorieTarifaire[];
}

export interface CreateDevisPayload {
  client_id: number;
  model_devis_id?: number | null;
  categorie_tarifaire: string;
  type_doc_id: number | null;
}

export interface CreateDevisResponse {
  success: boolean;
  editUrl: string;
  clientId: number;
  clientNom: string;
}

export const crmService = {
  async getDevisCreationData(): Promise<DevisCreationData> {
    const { data } = await crmApi.get('/devis/creation-data.json');
    return data;
  },

  async createDevis(payload: CreateDevisPayload): Promise<CreateDevisResponse> {
    const { data } = await crmApi.post('/devis/create.json', payload);
    return data;
  },
};
