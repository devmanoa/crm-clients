export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3004',
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const API_ENDPOINTS = {
  CLIENTS: {
    LIST: '/api/clients/clients',
    GET: (id: number) => `/api/clients/clients/${id}`,
    CREATE: '/api/clients/clients',
    UPDATE: (id: number) => `/api/clients/clients/${id}`,
    DELETE: (id: number) => `/api/clients/clients/${id}`,
    SEARCH: '/api/clients/clients/search',
    DUPLICATES: '/api/clients/clients/duplicates',
    BULK_ACTION: '/api/clients/clients/bulk-action',
    CONTACTS: (clientId: number) => `/api/clients/clients/${clientId}/contacts`,
    CONTACT: (clientId: number, id: number) => `/api/clients/clients/${clientId}/contacts/${id}`,
    COMMENTS: (clientId: number) => `/api/clients/clients/${clientId}/comments`,
    COMMENT: (clientId: number, id: number) => `/api/clients/clients/${clientId}/comments/${id}`,
    DEVIS: (clientId: number) => `/api/clients/clients/${clientId}/devis`,
    DEVIS_ONE: (clientId: number, id: number) => `/api/clients/clients/${clientId}/devis/${id}`,
  },
  REFERENCE_DATA: {
    SECTORS: '/api/clients/reference-data/sectors',
    GROUPS: '/api/clients/reference-data/groups',
    SOURCES: '/api/clients/reference-data/sources',
    COUNTRIES: '/api/clients/reference-data/countries',
    CONTACT_TYPES: '/api/clients/reference-data/contact-types',
    OPPORTUNITY_STATUSES: '/api/clients/reference-data/opportunity-statuses',
  },
};
