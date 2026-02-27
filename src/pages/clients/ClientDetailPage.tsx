import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Pencil, Trash2, Phone, Mail, MapPin,
  Globe, Tag, Target, Send, Loader2, ChevronDown, ChevronUp,
  StickyNote, FileText, CheckSquare, MoreVertical,
  CheckCircle, Clock, XCircle, Receipt, CreditCard, AlertTriangle,
  Users,
} from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import { clientService } from '@/services/clientService';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import RichTextEditor, { type RichTextEditorRef } from '@/components/common/RichTextEditor';
import FloatingTooltip from '@/components/common/FloatingTooltip';
import type { ClientComment, DevisRef } from '@/types/client';

type Tab = 'devis' | 'factures' | 'avoirs' | 'reglements' | 'opportunities' | 'contacts' | 'retard';

const DEVIS_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  brouillon: { label: 'Brouillon', color: 'text-gray-600', bg: 'bg-gray-100' },
  envoye: { label: 'Envoyé', color: 'text-blue-700', bg: 'bg-blue-50' },
  accepte: { label: 'Accepté', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  refuse: { label: 'Refusé', color: 'text-red-700', bg: 'bg-red-50' },
  annule: { label: 'Annulé', color: 'text-gray-500', bg: 'bg-gray-50' },
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentClient, isLoadingDetail, fetchClientById, clearCurrentClient, deleteClient } = useClientStore();
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [commentHtml, setCommentHtml] = useState('');
  const editorRef = useRef<RichTextEditorRef>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'comments' | 'actions'>('all');
  const [pdfDevisId, setPdfDevisId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) fetchClientById(parseInt(id));
    return () => clearCurrentClient();
  }, [id]);

  useEffect(() => {
    if (currentClient?.comments) {
      setComments(currentClient.comments);
    }
  }, [currentClient?.comments]);

  const handleSubmitComment = async () => {
    const html = editorRef.current?.getHTML() || '';
    const isEmpty = !html || html === '<p></p>' || html.trim() === '';
    if (!id || isEmpty) return;
    setIsSubmittingComment(true);
    try {
      const res = await clientService.createComment(parseInt(id), html);
      if (res.success && res.data) {
        setComments(prev => [res.data, ...prev]);
        editorRef.current?.clear();
        setCommentHtml('');
      }
    } catch {
      // Error handled by axios interceptor
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!id || !confirm('Supprimer ce commentaire ?')) return;
    try {
      await clientService.deleteComment(parseInt(id), commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      // Error handled by axios interceptor
    }
  };

  if (isLoadingDetail) return <LoadingSpinner />;
  if (!currentClient) return <div className="text-center py-12 text-[--k-muted]">Client non trouvé</div>;

  const client = currentClient;
  const clientName = client.client_type === 'corporation'
    ? (client.enseigne ? `${client.nom} - ${client.enseigne}` : client.nom)
    : `${client.nom} ${client.prenom || ''}`.trim();

  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      await deleteClient(client.id);
      navigate('/clients');
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Devis stats
  const devisRefs = client.devisRefs || [];
  const devisAccepte = devisRefs.filter(d => d.status === 'accepte');
  const devisAttente = devisRefs.filter(d => d.status === 'envoye' || d.status === 'brouillon');
  const devisRefuse = devisRefs.filter(d => d.status === 'refuse' || d.status === 'annule');
  const sumHt = (list: DevisRef[]) => list.reduce((s, d) => s + (Number(d.totalHt) || 0), 0);

  // Tab definitions
  const tabDefs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'devis', label: 'Devis', count: devisRefs.length, icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'factures', label: 'Factures', count: 0, icon: <Receipt className="w-3.5 h-3.5" /> },
    { key: 'avoirs', label: 'Avoirs', count: 0, icon: <CreditCard className="w-3.5 h-3.5" /> },
    { key: 'reglements', label: 'Règlements', count: 0, icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { key: 'opportunities', label: 'Opportunités', count: client._count?.opportunities || 0, icon: <Target className="w-3.5 h-3.5" /> },
    { key: 'contacts', label: 'Contacts', count: client._count?.contacts || 0, icon: <Users className="w-3.5 h-3.5" /> },
    { key: 'retard', label: 'Factures retard', count: 0, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-[--k-muted]">
        <button onClick={() => navigate('/clients/dashboard')} className="hover:text-[--k-text] transition">Tableau de bord</button>
        <span>/</span>
        <button onClick={() => navigate('/clients')} className="hover:text-[--k-text] transition">Clients</button>
        <span>/</span>
        <span className="text-[--k-text] font-medium">Fiche client #{client.id}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* ====================== MAIN CONTENT (9/12) ====================== */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ---- Header Card ---- */}
          <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-5">
            {/* Title row */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-[--k-text] flex items-center gap-2 flex-wrap">
                    {clientName}
                    <Link to={`/clients/${client.id}/edit`} className="text-[--k-primary] hover:opacity-80">
                      <Pencil className="w-4 h-4" />
                    </Link>
                  </h1>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[--k-text] bg-[--k-surface-2] border border-[--k-border] rounded-lg hover:brightness-95 transition">
                  <StickyNote className="w-3.5 h-3.5" />
                  Ajouter une note
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[--k-text] bg-[--k-surface-2] border border-[--k-border] rounded-lg hover:brightness-95 transition">
                  <FileText className="w-3.5 h-3.5" />
                  Créer un devis
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[--k-text] bg-[--k-surface-2] border border-[--k-border] rounded-lg hover:brightness-95 transition">
                  <CheckSquare className="w-3.5 h-3.5" />
                  Ajouter une tâche
                </button>
              </div>
            </div>

            {/* Badges + contact info */}
            <div className="mt-3 space-y-2">
              {client.sectors && client.sectors.length > 0 && (
                <p className="text-[13px] text-[--k-muted]">
                  <MapPin className="w-3.5 h-3.5 inline mr-1" />
                  {client.sectors.map(cs => cs.sector.nom).join(', ')}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                  client.type_commercial === 'prospect' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {client.type_commercial === 'prospect' ? 'Prospect' : 'Client'}
                </span>
                <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                  client.client_type === 'corporation' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {client.client_type === 'corporation' ? 'Pro' : 'Part'}
                </span>
                {client.is_qualifie && (
                  <span className="inline-flex px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700">
                    Qualifié
                  </span>
                )}
              </div>

              {/* Address */}
              {(client.adresse || client.ville) && (
                <p className="text-[13px] text-[--k-text] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[--k-muted] shrink-0" />
                  {[client.adresse, [client.cp, client.ville].filter(Boolean).join(' ')].filter(Boolean).join(' - ')}
                </p>
              )}

              {/* Email / Phone */}
              {(client.email || client.telephone || client.mobile) && (
                <p className="text-[13px] text-[--k-text] flex items-center gap-3 flex-wrap">
                  {client.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[--k-muted]" />
                      <a href={`mailto:${client.email}`} className="text-[--k-primary] hover:underline">{client.email}</a>
                    </span>
                  )}
                  {client.telephone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[--k-muted]" />
                      {client.telephone}
                    </span>
                  )}
                  {client.mobile && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[--k-muted]" />
                      {client.mobile}
                    </span>
                  )}
                </p>
              )}

              {client.site_web && (
                <p className="text-[13px] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[--k-muted]" />
                  <a href={client.site_web} target="_blank" rel="noreferrer" className="text-[--k-primary] hover:underline">{client.site_web}</a>
                </p>
              )}

              {/* Code client / SIREN / SIRET */}
              <div className="text-[13px] text-[--k-muted] space-y-0.5 pt-1">
                {client.code_quadra && <p>Code client : {client.code_quadra}</p>}
                {client.idClientCrm && <p>ID CRM : {client.idClientCrm}</p>}
                {client.siren && <p>Siren : {client.siren}</p>}
                {client.siret && <p>Siret : {client.siret}</p>}
                {client.tva_intracom && <p>TVA Intracom : {client.tva_intracom}</p>}
              </div>

              {/* More actions */}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  to={`/clients/${client.id}/edit`}
                  className="p-1.5 text-[--k-muted] hover:text-[--k-primary] hover:bg-[--k-surface-2] rounded-lg transition"
                  title="Modifier"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <div className="relative group">
                  <button className="p-1.5 text-[--k-muted] hover:text-[--k-text] hover:bg-[--k-surface-2] rounded-lg transition">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="hidden group-hover:block absolute left-0 z-10 mt-1 w-48 bg-[--k-surface] rounded-xl border border-[--k-border] shadow-lg py-1">
                    <button
                      onClick={handleDelete}
                      className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[--k-danger] hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Tab Buttons ---- */}
          <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-4">
            <div className="flex items-center gap-2 flex-wrap">
              {tabDefs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(activeTab === tab.key ? null : tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded-lg transition ${
                    activeTab === tab.key
                      ? 'bg-[--k-primary] text-white'
                      : 'bg-[--k-surface-2] text-[--k-text] hover:brightness-95'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  <span className="ml-0.5 text-[11px] opacity-80">{tab.count}</span>
                </button>
              ))}
            </div>

            {/* ---- Devis Tab ---- */}
            {activeTab === 'devis' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => setActiveTab(null)} className="text-[12px] text-[--k-primary] hover:underline">Fermer</button>
                  {client.idClientCrm && (
                    <a
                      href={`${import.meta.env.VITE_CRM_URL || 'https://crm.konitys.fr'}/fr/devis/add?client_id=${client.idClientCrm}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium bg-[--k-primary] text-white rounded-lg hover:brightness-110 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Créer un devis
                    </a>
                  )}
                </div>

                {/* Devis summary */}
                {devisRefs.length > 0 ? (
                  <>
                    <div className="flex items-center gap-4 flex-wrap text-[13px] mb-4">
                      {devisAccepte.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Accepté(s) : {devisAccepte.length} &rarr; <strong>{formatCurrency(sumHt(devisAccepte))} HT</strong>
                        </span>
                      )}
                      {devisAttente.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-500" />
                          En attente : {devisAttente.length} &rarr; <strong>{formatCurrency(sumHt(devisAttente))} HT</strong>
                        </span>
                      )}
                      {devisRefuse.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-red-500" />
                          Refusé(s) : {devisRefuse.length} &rarr; <strong>{formatCurrency(sumHt(devisRefuse))} HT</strong>
                        </span>
                      )}
                    </div>

                    {/* Devis list table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-[--k-border]">
                            <th className="px-3 py-2 text-left text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Référence</th>
                            <th className="px-3 py-2 text-left text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2 text-right text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Montant HT</th>
                            <th className="px-3 py-2 text-right text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Montant TTC</th>
                            <th className="px-3 py-2 text-center text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Statut</th>
                            <th className="px-3 py-2 text-center text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devisRefs.map((d) => {
                            const st = DEVIS_STATUS_LABELS[d.status] || DEVIS_STATUS_LABELS.brouillon;
                            // Strip HTML tags from objet for tooltip
                            const objetText = d.objet ? d.objet.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
                            const crmUrl = import.meta.env.VITE_CRM_URL || 'https://crm.konitys.fr';
                            return (
                              <tr key={d.id} className="border-t border-[--k-border] hover:bg-[--k-surface-2] transition-colors">
                                <td className="px-3 py-2 font-medium text-[--k-primary]">
                                  {objetText ? (
                                    <FloatingTooltip content={objetText}>
                                      <button
                                        onClick={() => d.idDevisCrm && setPdfDevisId(d.idDevisCrm)}
                                        className="hover:underline cursor-pointer"
                                      >
                                        {d.indent || `#${d.id}`}
                                      </button>
                                    </FloatingTooltip>
                                  ) : (
                                    <button
                                      onClick={() => d.idDevisCrm && setPdfDevisId(d.idDevisCrm)}
                                      className="hover:underline cursor-pointer"
                                    >
                                      {d.indent || `#${d.id}`}
                                    </button>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-[--k-muted]">{d.dateCreation ? formatDate(d.dateCreation) : '--'}</td>
                                <td className="px-3 py-2 text-right font-medium text-[--k-text]">{d.totalHt ? formatCurrency(d.totalHt) : '--'}</td>
                                <td className="px-3 py-2 text-right text-[--k-muted]">{d.totalTtc ? formatCurrency(d.totalTtc) : '--'}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${st.bg} ${st.color}`}>
                                    {st.label}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {d.idDevisCrm && (
                                    <div className="relative group/actions">
                                      <button className="p-1 text-[--k-muted] hover:text-[--k-text] hover:bg-[--k-surface-2] rounded-lg transition">
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                      <div className="hidden group-hover/actions:block absolute right-0 z-20 mt-1 w-44 bg-[--k-surface] rounded-xl border border-[--k-border] shadow-lg py-1">
                                        <a
                                          href={`${crmUrl}/fr/devis/add/${d.idDevisCrm}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 px-3 py-2 text-[13px] text-[--k-text] hover:bg-[--k-surface-2] transition"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          Éditer
                                        </a>
                                        <button
                                          onClick={() => setPdfDevisId(d.idDevisCrm!)}
                                          className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[--k-text] hover:bg-[--k-surface-2] transition"
                                        >
                                          <FileText className="w-3.5 h-3.5" />
                                          Voir le document
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-[--k-muted]">Aucun devis pour ce client.</p>
                )}
              </div>
            )}

            {/* ---- Factures Tab ---- */}
            {activeTab === 'factures' && (
              <div className="mt-4">
                <button onClick={() => setActiveTab(null)} className="text-[12px] text-[--k-primary] hover:underline mb-3 block">Fermer</button>
                <p className="text-[13px] text-[--k-muted]">Aucune facture pour ce client.</p>
              </div>
            )}

            {/* ---- Avoirs Tab ---- */}
            {activeTab === 'avoirs' && (
              <div className="mt-4">
                <button onClick={() => setActiveTab(null)} className="text-[12px] text-[--k-primary] hover:underline mb-3 block">Fermer</button>
                <p className="text-[13px] text-[--k-muted]">Aucun avoir pour ce client.</p>
              </div>
            )}

            {/* ---- Règlements Tab ---- */}
            {activeTab === 'reglements' && (
              <div className="mt-4">
                <button onClick={() => setActiveTab(null)} className="text-[12px] text-[--k-primary] hover:underline mb-3 block">Fermer</button>
                <p className="text-[13px] text-[--k-muted]">Aucun règlement pour ce client.</p>
              </div>
            )}

            {/* ---- Opportunities Tab ---- */}
            {activeTab === 'opportunities' && (
              <div className="mt-4">
                <button onClick={() => setActiveTab(null)} className="text-[12px] text-[--k-primary] hover:underline mb-3 block">Fermer</button>

                {client.opportunities && client.opportunities.length > 0 ? (
                  <div className="space-y-3">
                    {client.opportunities.map((opp: any) => (
                      <div key={opp.id} className="border border-[--k-border] rounded-xl overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[--k-surface-2] transition"
                          onClick={() => toggleExpand(`opp-${opp.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-[--k-primary] flex items-center justify-center">
                              <Target className="w-3 h-3 text-white" />
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/opportunities/${opp.id}`); }}
                              className="text-[14px] font-medium text-[--k-primary] hover:underline"
                            >
                              {opp.nom}
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            {opp.stage && (
                              <span
                                className="inline-flex px-2.5 py-0.5 text-[11px] font-semibold rounded-full"
                                style={{ backgroundColor: (opp.stage?.couleur || '#6B7280') + '20', color: opp.stage?.couleur || '#6B7280' }}
                              >
                                {opp.stage?.nom}
                              </span>
                            )}
                            {opp.montant && (
                              <span className="text-[13px] font-medium text-[--k-text]">{formatCurrency(opp.montant)}</span>
                            )}
                            <span className="text-[12px] text-[--k-muted] italic">{formatDate(opp.created_at || opp.createdAt)}</span>
                            {expandedItems[`opp-${opp.id}`]
                              ? <ChevronUp className="w-4 h-4 text-[--k-muted]" />
                              : <ChevronDown className="w-4 h-4 text-[--k-muted]" />
                            }
                          </div>
                        </div>
                        {expandedItems[`opp-${opp.id}`] && (
                          <div className="px-4 py-3 border-t border-[--k-border] bg-[--k-surface-2] text-[13px] space-y-1">
                            <p><strong>Pipeline :</strong> {opp.pipeline?.nom || '--'}</p>
                            <p><strong>Étape :</strong> {opp.stage?.nom || '--'}</p>
                            <p><strong>Potentiel :</strong> {opp.montant ? formatCurrency(opp.montant) : '--'}</p>
                            <p><strong>Date :</strong> {formatDate(opp.created_at || opp.createdAt)}</p>
                            {opp.is_hot && <p className="text-[--k-danger] font-medium flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Opportunité chaude</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[--k-muted]">Aucune opportunité pour ce client.</p>
                )}
              </div>
            )}

            {/* ---- Contacts Tab ---- */}
            {activeTab === 'contacts' && (
              <div className="mt-4">
                <button onClick={() => setActiveTab(null)} className="text-[12px] text-[--k-primary] hover:underline mb-3 block">Fermer</button>

                {client.contacts && client.contacts.length > 0 ? (
                  <div className="space-y-4">
                    {(() => {
                      // Group contacts by contact_type
                      const grouped = new Map<string, typeof client.contacts>();
                      for (const contact of client.contacts!) {
                        const typeName = contact.contact_type?.nom || 'Autre';
                        if (!grouped.has(typeName)) grouped.set(typeName, []);
                        grouped.get(typeName)!.push(contact);
                      }
                      return Array.from(grouped.entries()).map(([typeName, contacts]) => (
                        <div key={typeName}>
                          <h4 className="text-[13px] font-semibold text-[--k-text] mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[--k-primary]" />
                            {typeName}
                            <span className="text-[11px] font-normal text-[--k-muted]">({contacts.length})</span>
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-[13px]">
                              <thead>
                                <tr className="border-b border-[--k-border]">
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Nom</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Fonction</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Email</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Téléphone</th>
                                  <th className="px-3 py-2 text-left text-[11px] font-semibold text-[--k-muted] uppercase tracking-wider">Principal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {contacts.map((contact) => (
                                  <tr key={contact.id} className="border-t border-[--k-border] hover:bg-[--k-surface-2] transition-colors">
                                    <td className="px-3 py-2 font-medium text-[--k-text]">
                                      {contact.civilite && <span className="text-[--k-muted]">{contact.civilite}. </span>}
                                      {contact.prenom} {contact.nom}
                                    </td>
                                    <td className="px-3 py-2 text-[--k-muted]">{contact.position || '--'}</td>
                                    <td className="px-3 py-2 text-[--k-muted]">
                                      {contact.email ? (
                                        <a href={`mailto:${contact.email}`} className="text-[--k-primary] hover:underline">{contact.email}</a>
                                      ) : '--'}
                                    </td>
                                    <td className="px-3 py-2 text-[--k-muted]">
                                      {contact.tel || contact.telephone_2 || '--'}
                                      {contact.tel && contact.telephone_2 && (
                                        <span className="text-[--k-muted] ml-1">/ {contact.telephone_2}</span>
                                      )}
                                    </td>
                                    <td className="px-3 py-2">
                                      {contact.is_primary && (
                                        <span className="inline-flex px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full">Principal</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-[13px] text-[--k-muted]">Aucun contact pour ce client.</p>
                )}
              </div>
            )}

            {/* ---- Retard Tab ---- */}
            {activeTab === 'retard' && (
              <div className="mt-4">
                <button onClick={() => setActiveTab(null)} className="text-[12px] text-[--k-primary] hover:underline mb-3 block">Fermer</button>
                <p className="text-[13px] text-[--k-muted]">Aucune facture en retard.</p>
              </div>
            )}
          </div>

          {/* ---- Business Info (corporations) ---- */}
          {client.client_type === 'corporation' && (client.code_naf || client.effectif || client.chiffre_affaire) && (
            <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-5">
              <h5 className="text-[14px] font-semibold text-[--k-text] mb-3">Informations entreprise</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[13px]">
                {client.code_naf && (
                  <div>
                    <p className="text-[--k-muted]">Code NAF</p>
                    <p className="font-medium text-[--k-text]">{client.code_naf}</p>
                  </div>
                )}
                {client.effectif && (
                  <div>
                    <p className="text-[--k-muted]">Effectif</p>
                    <p className="font-medium text-[--k-text]">{client.effectif}</p>
                  </div>
                )}
                {client.chiffre_affaire && (
                  <div>
                    <p className="text-[--k-muted]">Chiffre d'affaires</p>
                    <p className="font-medium text-[--k-text]">{formatCurrency(client.chiffre_affaire)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ---- Activity Section ---- */}
          <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-5">
            <h3 className="text-[15px] font-semibold text-[--k-text] mb-3">Activité(s)</h3>

            {/* Activity filters */}
            <div className="flex items-center gap-2 mb-4 text-[12px]">
              <span className="text-[--k-muted]">Afficher :</span>
              {(['all', 'comments', 'actions'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  className={`px-3 py-1 rounded-lg transition ${
                    activityFilter === filter
                      ? 'bg-[--k-primary] text-white'
                      : 'bg-[--k-surface-2] text-[--k-text] hover:brightness-95'
                  }`}
                >
                  {filter === 'all' ? 'Tout' : filter === 'comments' ? 'Commentaires' : 'Actions'}
                </button>
              ))}
            </div>

            {/* Add comment form */}
            <div className="space-y-3 mb-4">
              <RichTextEditor
                ref={editorRef}
                placeholder="Ajouter un commentaire... (texte, images, listes...)"
                onChange={setCommentHtml}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitComment}
                  disabled={isSubmittingComment || !commentHtml || commentHtml === '<p></p>'}
                  className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-white bg-[--k-primary] rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm shadow-[var(--k-primary)]/20"
                >
                  {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Envoyer
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div className="space-y-3">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="border border-[--k-border] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[--k-primary-2] flex items-center justify-center">
                          <span className="text-xs font-medium text-[--k-primary]">
                            {(comment.user_name || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <span className="text-[13px] font-medium text-[--k-text]">{comment.user_name || 'Utilisateur'}</span>
                        <span className="text-[11px] text-[--k-muted]">{formatDateTime(comment.created_at)}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-[--k-muted] hover:text-[--k-danger] rounded-lg hover:bg-red-50 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div
                      className="comment-content text-[13px] text-[--k-text]"
                      dangerouslySetInnerHTML={{ __html: comment.contenu }}
                    />
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {comment.attachments.map((file) => (
                          <a
                            key={file.id}
                            href={file.file_path}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-[--k-surface-2] text-[--k-muted] rounded-lg hover:brightness-95"
                          >
                            {file.file_name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-[13px] text-[--k-muted] py-4">Aucun commentaire</p>
              )}
            </div>
          </div>
        </div>

        {/* ====================== SIDEBAR (3/12) ====================== */}
        <div className="w-full lg:w-[280px] shrink-0 space-y-4">

          {/* Stats client */}
          <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-5">
            <h3 className="text-[14px] font-semibold text-[--k-text] mb-4">Stats client</h3>

            <div className="space-y-3 text-[13px]">
              {/* Counts grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2.5 bg-[--k-surface-2] rounded-xl">
                  <p className="text-xl font-bold text-[--k-primary]">{client._count?.opportunities || 0}</p>
                  <p className="text-[11px] text-[--k-muted]">Opportunités</p>
                </div>
                <div className="text-center p-2.5 bg-[--k-surface-2] rounded-xl">
                  <p className="text-xl font-bold text-[--k-primary]">{client._count?.contacts || 0}</p>
                  <p className="text-[11px] text-[--k-muted]">Contacts</p>
                </div>
                <div className="text-center p-2.5 bg-[--k-surface-2] rounded-xl">
                  <p className="text-xl font-bold text-[--k-primary]">{devisRefs.length}</p>
                  <p className="text-[11px] text-[--k-muted]">Devis</p>
                </div>
                <div className="text-center p-2.5 bg-[--k-surface-2] rounded-xl">
                  <p className="text-xl font-bold text-[--k-primary]">{client._count?.comments || 0}</p>
                  <p className="text-[11px] text-[--k-muted]">Commentaires</p>
                </div>
              </div>

              {/* Devis summary in sidebar */}
              {devisRefs.length > 0 && (
                <div className="border-t border-[--k-border] pt-3 space-y-2">
                  {devisAccepte.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" /> Acceptés
                      </span>
                      <span className="font-medium text-[--k-text]">{formatCurrency(sumHt(devisAccepte))}</span>
                    </div>
                  )}
                  {devisAttente.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <Clock className="w-3.5 h-3.5" /> En attente
                      </span>
                      <span className="font-medium text-[--k-text]">{formatCurrency(sumHt(devisAttente))}</span>
                    </div>
                  )}
                  {devisRefuse.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-red-500">
                        <XCircle className="w-3.5 h-3.5" /> Refusés
                      </span>
                      <span className="font-medium text-[--k-text]">{formatCurrency(sumHt(devisRefuse))}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-[--k-border] pt-3 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-[--k-muted]">Groupe</span>
                  <span className="text-[--k-text] font-medium">{client.groupe_client?.nom || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--k-muted]">Source</span>
                  <span className="text-[--k-text] font-medium">{client.source_lead?.nom || '--'}</span>
                </div>
                {client.code_quadra && (
                  <div className="flex justify-between">
                    <span className="text-[--k-muted]">Code Quadra</span>
                    <span className="text-[--k-text] font-medium">{client.code_quadra}</span>
                  </div>
                )}
              </div>

              {client.contact_raison && (
                <div className="border-t border-[--k-border] pt-3">
                  <p className="text-[--k-muted] mb-1">Contact pour</p>
                  <p className="text-[--k-text] font-medium">{client.contact_raison}</p>
                </div>
              )}

              {client.connaissance_selfizee && (
                <div className="border-t border-[--k-border] pt-3">
                  <p className="text-[--k-muted] mb-1">Comment a-t-il connu ?</p>
                  <p className="text-[--k-text]">{client.connaissance_selfizee}</p>
                </div>
              )}

              <div className="border-t border-[--k-border] pt-3">
                <p className="text-[--k-muted] mb-1">Création du client</p>
                <p className="text-[--k-text]">
                  Créé le : <em>{formatDate(client.created_at)}</em>
                </p>
                {client.updated_at && client.updated_at !== client.created_at && (
                  <p className="text-[--k-text] mt-0.5">
                    Modifié le : <em>{formatDate(client.updated_at)}</em>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sectors */}
          {client.sectors && client.sectors.length > 0 && (
            <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-5">
              <h3 className="text-[14px] font-semibold text-[--k-text] mb-3">Secteurs d'activité</h3>
              <div className="flex flex-wrap gap-2">
                {client.sectors.map((cs) => (
                  <span
                    key={cs.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[--k-surface-2] text-[--k-muted] rounded-full"
                  >
                    <Tag className="w-3 h-3" />
                    {cs.sector.nom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.note && (
            <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-5">
              <h3 className="text-[14px] font-semibold text-[--k-text] mb-3">Notes</h3>
              <p className="text-[13px] text-[--k-text] whitespace-pre-wrap">{client.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* PDF Devis Modal */}
      {pdfDevisId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPdfDevisId(null)}
        >
          <div
            className="relative w-[90vw] h-[85vh] max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="text-[14px] font-semibold text-gray-800">Devis PDF</h3>
              <button
                onClick={() => setPdfDevisId(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <iframe
              src={`${import.meta.env.VITE_CRM_URL || 'https://crm.konitys.fr'}/fr/devis/pdfversion/${pdfDevisId}`}
              className="w-full h-[calc(100%-52px)]"
              title="Devis PDF"
            />
          </div>
        </div>
      )}
    </div>
  );
}
