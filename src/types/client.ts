export type ClientType = 'corporation' | 'person';
export type TypeCommercial = 'client' | 'prospect';

export interface Client {
  id: number;
  idClientCrm?: string;
  client_type: ClientType;
  nom: string;
  prenom?: string;
  enseigne?: string;
  siren?: string;
  siret?: string;
  tva_intracom?: string;
  code_naf?: string;
  effectif?: number;
  chiffre_affaire?: number;
  email?: string;
  telephone?: string;
  mobile?: string;
  adresse?: string;
  adresse_2?: string;
  cp?: string;
  ville?: string;
  pays_id?: number;
  departement?: string;
  country?: string;
  addr_lat?: string;
  addr_lng?: string;
  site_web?: string;
  note?: string;
  code_quadra?: string;
  groupe_client_id?: number;
  source_lead_id?: number;
  type_commercial?: TypeCommercial;
  contact_raison?: string;
  connaissance_selfizee?: string;
  is_qualifie: boolean;
  is_deleted: boolean;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;

  // Relations
  pays?: Country;
  groupe_client?: GroupeClient;
  source_lead?: SourceLead;
  contacts?: ClientContact[];
  addresses?: ClientAddress[];
  sectors?: ClientSectorRelation[];
  comments?: ClientComment[];
  opportunities?: any[];
  devisRefs?: DevisRef[];
  _count?: {
    opportunities: number;
    comments: number;
    contacts: number;
    addresses?: number;
    devisRefs?: number;
  };
}

export interface ClientContact {
  id: number;
  idClientCrm?: string;
  client_id: number;
  civilite?: string;
  nom: string;
  prenom?: string;
  position?: string;
  email?: string;
  tel?: string;
  telephone_2?: string;
  contact_type_id?: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  contact_type?: ContactType;
}

export interface ClientAddress {
  id: number;
  client_id: number;
  label?: string;
  adresse?: string;
  adresse_2?: string;
  cp?: string;
  ville?: string;
  pays_id?: number;
  latitude?: string;
  longitude?: string;
  is_primary: boolean;
  pays?: Country;
}

export interface ClientComment {
  id: number;
  client_id: number;
  user_id?: number;
  user_name?: string;
  contenu: string;
  created_at: string;
  updated_at: string;
  attachments?: CommentAttachment[];
}

export interface CommentAttachment {
  id: number;
  comment_id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

export interface ClientSectorRelation {
  id: number;
  client_id: number;
  secteur_activite_id: number;
  sector: SecteurActivite;
}

// Devis
export type DevisStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'annule';

export interface DevisRef {
  id: number;
  clientId: number;
  indent?: string;
  objet?: string;
  status: DevisStatus;
  totalHt?: number;
  totalTtc?: number;
  totalTva?: number;
  dateCreation?: string;
  dateValidite?: string;
  dateSignature?: string;
  commercialId?: number;
  commercialNom?: string;
  note?: string;
  idDevisCrm?: string;
  createdAt: string;
  updatedAt: string;
}

// Reference data
export interface Country {
  id: number;
  nom: string;
  code?: string;
  phonecode?: string;
}

export interface GroupeClient {
  id: number;
  nom: string;
}

export interface SourceLead {
  id: number;
  nom: string;
}

export interface SecteurActivite {
  id: number;
  nom: string;
  parent_id?: number;
  children?: SecteurActivite[];
}

export interface ContactType {
  id: number;
  nom: string;
}

// Filters
export interface ClientFilters {
  key?: string;
  clientType?: ClientType;
  typeCommercial?: TypeCommercial;
  groupeClientId?: number;
  sourceLeadId?: number;
  departement?: string;
  sectorIds?: number[];
  isQualifie?: boolean;
  hasAddress?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Form data
export interface ClientFormData {
  idClientCrm?: string;
  client_type: ClientType;
  nom: string;
  prenom?: string;
  enseigne?: string;
  siren?: string;
  siret?: string;
  tva_intracom?: string;
  code_naf?: string;
  effectif?: number;
  chiffre_affaire?: number;
  email?: string;
  telephone?: string;
  mobile?: string;
  adresse?: string;
  adresse_2?: string;
  cp?: string;
  ville?: string;
  pays_id?: number;
  departement?: string;
  country?: string;
  site_web?: string;
  note?: string;
  groupe_client_id?: number;
  source_lead_id?: number;
  type_commercial?: TypeCommercial;
  contact_raison?: string;
  sectorIds?: number[];
}
