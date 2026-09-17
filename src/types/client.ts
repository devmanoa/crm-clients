export type ClientType = 'corporation' | 'person';
export type TypeCommercial = 'client' | 'prospect';

// Prisma sérialise ses champs en camelCase : les noms ci-dessous sont ceux
// réellement renvoyés par l'API, pas ceux des colonnes SQL. Les formulaires,
// eux, envoient du snake_case (voir ClientFormData et mapClientBody côté API).
export interface Client {
  id: number;
  idClientCrm?: string;
  clientType: ClientType;
  nom: string;
  prenom?: string;
  enseigne?: string;
  siren?: string;
  siret?: string;
  tvaIntracom?: string;
  codeNaf?: string;
  effectif?: number;
  chiffreAffaire?: number;
  email?: string;
  telephone?: string;
  mobile?: string;
  adresse?: string;
  adresse2?: string;
  cp?: string;
  ville?: string;
  paysId?: number;
  departement?: string;
  country?: string;
  addrLat?: string;
  addrLng?: string;
  siteWeb?: string;
  note?: string;
  codeQuadra?: string;
  groupeClientId?: number;
  sourceLeadId?: number;
  typeCommercial?: TypeCommercial;
  contactRaison?: string;
  connaissanceSelfizee?: string;
  isQualifie: boolean;
  isDeleted: boolean;
  createdBy?: number;
  updatedBy?: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  pays?: Country;
  groupeClient?: GroupeClient;
  sourceLead?: SourceLead;
  contacts?: ClientContact[];
  addresses?: ClientAddress[];
  sectors?: ClientSectorRelation[];
  comments?: ClientComment[];
  opportunities?: any[];
  devisRefs?: DevisRef[];
  factureRefs?: FactureRef[];
  avoirRefs?: AvoirRef[];
  reglementRefs?: ReglementRef[];
  _count?: {
    opportunities: number;
    comments: number;
    contacts: number;
    addresses?: number;
    devisRefs?: number;
    factureRefs?: number;
    avoirRefs?: number;
    reglementRefs?: number;
  };
}

// Prisma sérialise en camelCase : les noms ci-dessous sont ceux réellement
// renvoyés par l'API, pas ceux des colonnes SQL.
export interface ClientContact {
  id: number;
  idClientCrm?: string;
  clientId: number;
  civilite?: string;
  nom: string;
  prenom?: string;
  position?: string;
  email?: string;
  tel?: string;
  telephone2?: string;
  contactTypeId?: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  contactType?: ContactType;
}

export interface ClientAddress {
  id: number;
  clientId: number;
  /** Nom de l'adresse : « Principale », « Bureau », « Livraison »… texte libre. */
  label?: string | null;
  adresse?: string | null;
  adresse2?: string | null;
  cp?: string | null;
  ville?: string | null;
  paysId?: number | null;
  latitude?: string | null;
  longitude?: string | null;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
  pays?: Country;
}

/** Valeurs proposées dans le formulaire d'adresse, sans être imposées. */
export const ADDRESS_LABEL_SUGGESTIONS = [
  'Principale',
  'Bureau',
  'Siège social',
  'Facturation',
  'Livraison',
  'Entrepôt',
] as const;

export interface ClientComment {
  id: number;
  clientId: number;
  userId?: number;
  userName?: string;
  contenu: string;
  createdAt: string;
  updatedAt: string;
  attachments?: CommentAttachment[];
}

export interface CommentAttachment {
  id: number;
  commentId: number;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
}

export interface ClientSectorRelation {
  id: number;
  clientId: number;
  sectorId: number;
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

// Factures
export type FactureStatus = 'brouillon' | 'emise' | 'payee' | 'partiellement_payee' | 'annulee' | 'en_recouvrement';

export interface FactureRef {
  id: number;
  clientId: number;
  indent?: string;
  objet?: string;
  status: FactureStatus;
  totalHt?: number;
  totalTtc?: number;
  totalTva?: number;
  dateCreation?: string;
  dateEvenement?: string;
  restantDu?: number;
  nbrReglement?: number;
  commercialNom?: string;
  idFactureCrm?: string;
  createdAt: string;
  updatedAt: string;
}

// Avoirs
export interface AvoirRef {
  id: number;
  clientId: number;
  indent?: string;
  objet?: string;
  status: FactureStatus;
  totalHt?: number;
  totalTtc?: number;
  totalTva?: number;
  dateCreation?: string;
  restantDu?: number;
  nbrReglement?: number;
  factureIndent?: string;
  commercialNom?: string;
  idAvoirCrm?: string;
  createdAt: string;
  updatedAt: string;
}

// Reglements
export interface ReglementRef {
  id: number;
  clientId: number;
  type: string; // "C" crédit, "D" débit
  date?: string;
  montant?: number;
  montantRestant?: number;
  moyenReglement?: string;
  reference?: string;
  note?: string;
  etat?: string;
  commercialNom?: string;
  idReglementCrm?: string;
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
  /** Nombre de clients rattachés. Renvoyé par /api/clients/sectors uniquement. */
  clientCount?: number;
  /**
   * Hiérarchie non exploitée : le référentiel est plat aujourd'hui (aucun
   * secteur ne porte de parent) et l'API ne renvoie plus `children`.
   * Conservé pour le jour où les secteurs seront regroupés.
   */
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
  hasDevis?: boolean;
  hasFacture?: boolean;
  hasReglement?: boolean;
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
  /**
   * Liste complète des adresses du client. Envoyée telle quelle : le serveur
   * remplace l'existant et recopie la principale dans les champs adresse/cp/
   * ville ci-dessus. Champ absent = adresses inchangées.
   */
  addresses?: ClientAddressFormData[];
}

// Tableau de bord

export interface DashboardStats {
  clients: {
    total: number;
    corporations: number;
    persons: number;
    qualified: number;
    newThisMonth: number;
    newPrevMonth: number;
    withoutEmail: number;
  };
  devis: {
    total: number;
    byStatus: Record<string, { count: number; totalHt: number }>;
    /** Part des devis acceptés parmi ceux tranchés, en %. null si aucun. */
    conversionRate: number | null;
    pendingAmount: number;
  };
  factures: {
    total: number;
    byStatus: Record<string, { count: number; totalTtc: number }>;
    revenue: number;
    outstanding: number;
    overdueCount: number;
  };
  /** 12 derniers mois, du plus ancien au plus récent. `month` au format YYYY-MM. */
  monthly: { month: string; devisHt: number; factureTtc: number }[];
  topClients: { id: number; label: string; totalTtc: number; factureCount: number }[];
  bySector: { id: number; nom: string; clientCount: number }[];
}

// Doublons / fusion

/** Un des deux clients d'une paire de doublons. */
export interface DuplicateSide {
  id: number;
  nom: string;
  prenom?: string | null;
  enseigne?: string | null;
  email?: string | null;
  telephone?: string | null;
  ville?: string | null;
  clientType: ClientType;
  createdAt: string;
}

export interface DuplicatePair {
  /** Ce qui a fait matcher la paire : même email ou même nom. */
  reason: 'email' | 'nom';
  left: DuplicateSide;
  right: DuplicateSide;
}

/** Décompte de ce qu'une fusion déplacerait, par type de donnée. */
export interface MergeMoves {
  contacts: number;
  addresses: number;
  comments: number;
  sectors: number;
  devis: number;
  factures: number;
  avoirs: number;
  reglements: number;
  opportunities: number;
}

export interface MergePreview {
  primary: { id: number; nom: string; label: string };
  duplicate: { id: number; nom: string; label: string };
  moves: MergeMoves;
  total: number;
}

export interface MergeResult {
  primary: { id: number; label: string };
  duplicate: { id: number; label: string };
  moved: MergeMoves;
  total: number;
}

export interface ClientAddressFormData {
  label?: string;
  adresse?: string;
  adresse2?: string;
  cp?: string;
  ville?: string;
  isPrimary?: boolean;
}
