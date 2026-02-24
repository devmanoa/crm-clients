import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import { clientService } from '@/services/clientService';
import ClientForm from '@/components/clients/ClientForm';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { ClientFormData } from '@/types/client';

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentClient, isLoadingDetail, fetchClientById, clearCurrentClient } = useClientStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchClientById(parseInt(id));
    return () => clearCurrentClient();
  }, [id]);

  const handleSubmit = async (formData: ClientFormData) => {
    if (!id) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await clientService.update(parseInt(id), formData);
      if (response.success) {
        navigate(`/clients/${id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise a jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetail) return <LoadingSpinner />;
  if (!currentClient) return <div className="text-center py-12 text-[var(--k-muted)]">Client non trouve</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-[var(--k-muted)] hover:text-[var(--k-text)] rounded-xl hover:bg-[var(--k-surface-2)] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--k-text)]">Modifier client</h1>
          <p className="text-sm text-[var(--k-muted)] mt-1">
            {currentClient.client_type === 'corporation'
              ? currentClient.enseigne || currentClient.nom
              : `${currentClient.prenom || ''} ${currentClient.nom}`.trim()}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-[var(--k-danger)] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <ClientForm
        defaultValues={{
          client_type: currentClient.client_type,
          nom: currentClient.nom,
          prenom: currentClient.prenom,
          enseigne: currentClient.enseigne,
          siren: currentClient.siren,
          siret: currentClient.siret,
          tva_intracom: currentClient.tva_intracom,
          code_naf: currentClient.code_naf,
          effectif: currentClient.effectif,
          chiffre_affaire: currentClient.chiffre_affaire,
          email: currentClient.email,
          telephone: currentClient.telephone,
          mobile: currentClient.mobile,
          adresse: currentClient.adresse,
          adresse_2: currentClient.adresse_2,
          cp: currentClient.cp,
          ville: currentClient.ville,
          pays_id: currentClient.pays_id,
          departement: currentClient.departement,
          country: currentClient.country,
          site_web: currentClient.site_web,
          note: currentClient.note,
          groupe_client_id: currentClient.groupe_client_id,
          source_lead_id: currentClient.source_lead_id,
          type_commercial: currentClient.type_commercial,
          contact_raison: currentClient.contact_raison,
          sectorIds: currentClient.sectors?.map((s) => s.secteur_activite_id),
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
