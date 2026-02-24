import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { clientService } from '@/services/clientService';
import ClientForm from '@/components/clients/ClientForm';
import type { ClientFormData } from '@/types/client';

export default function ClientCreatePage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: ClientFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await clientService.create(formData);
      if (response.success) {
        navigate(`/clients/${response.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la creation du client');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-[var(--k-text)]">Nouveau client</h1>
          <p className="text-sm text-[var(--k-muted)] mt-1">Remplissez les informations du client</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-[var(--k-danger)] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <ClientForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
