import { useEffect, useState } from 'react';
import { Save, Building2, User } from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import type { ClientFormData } from '@/types/client';

interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  isSubmitting: boolean;
}

export default function ClientForm({ defaultValues, onSubmit, isSubmitting }: ClientFormProps) {
  const { groupes, sources, secteurs, countries, fetchReferenceData } = useClientStore();
  const [form, setForm] = useState<ClientFormData>({
    client_type: 'corporation',
    nom: '',
    ...defaultValues,
  });

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const updateField = (field: keyof ClientFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const toggleSector = (sectorId: number) => {
    const current = form.sectorIds || [];
    const updated = current.includes(sectorId)
      ? current.filter((id) => id !== sectorId)
      : [...current, sectorId];
    updateField('sectorIds', updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client type toggle */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <h3 className="text-lg font-semibold text-[--k-text] mb-4">Type de client</h3>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => updateField('client_type', 'corporation')}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition ${
              form.client_type === 'corporation'
                ? 'border-[--k-primary] bg-[--k-primary-2] text-[--k-primary]'
                : 'border-[--k-border] text-[--k-muted] hover:border-[--k-muted]'
            }`}
          >
            <Building2 className="w-6 h-6" />
            <span className="font-medium">Professionnel</span>
          </button>
          <button
            type="button"
            onClick={() => updateField('client_type', 'person')}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition ${
              form.client_type === 'person'
                ? 'border-[--k-primary] bg-[--k-primary-2] text-[--k-primary]'
                : 'border-[--k-border] text-[--k-muted] hover:border-[--k-muted]'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="font-medium">Particulier</span>
          </button>
        </div>
      </div>

      {/* Identity */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <h3 className="text-lg font-semibold text-[--k-text] mb-4">Identite</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">ID Client CRM</label>
            <input
              type="text"
              value={form.idClientCrm || ''}
              onChange={(e) => updateField('idClientCrm', e.target.value || undefined)}
              placeholder="Identifiant CRM externe"
              className="input-field"
            />
          </div>
          {form.client_type === 'corporation' ? (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Raison sociale *</label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => updateField('nom', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Enseigne</label>
                <input
                  type="text"
                  value={form.enseigne || ''}
                  onChange={(e) => updateField('enseigne', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[--k-muted] mb-1">SIRET</label>
                <input
                  type="text"
                  value={form.siret || ''}
                  onChange={(e) => updateField('siret', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[--k-muted] mb-1">SIREN</label>
                <input
                  type="text"
                  value={form.siren || ''}
                  onChange={(e) => updateField('siren', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[--k-muted] mb-1">TVA intracommunautaire</label>
                <input
                  type="text"
                  value={form.tva_intracom || ''}
                  onChange={(e) => updateField('tva_intracom', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Code NAF</label>
                <input
                  type="text"
                  value={form.code_naf || ''}
                  onChange={(e) => updateField('code_naf', e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Nom *</label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => updateField('nom', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Prenom</label>
                <input
                  type="text"
                  value={form.prenom || ''}
                  onChange={(e) => updateField('prenom', e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <h3 className="text-lg font-semibold text-[--k-text] mb-4">Coordonnees</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Email</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Telephone</label>
            <input
              type="text"
              value={form.telephone || ''}
              onChange={(e) => updateField('telephone', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Mobile</label>
            <input
              type="text"
              value={form.mobile || ''}
              onChange={(e) => updateField('mobile', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Site web</label>
            <input
              type="url"
              value={form.site_web || ''}
              onChange={(e) => updateField('site_web', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <h3 className="text-lg font-semibold text-[--k-text] mb-4">Adresse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Adresse</label>
            <input
              type="text"
              value={form.adresse || ''}
              onChange={(e) => updateField('adresse', e.target.value)}
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Complement d'adresse</label>
            <input
              type="text"
              value={form.adresse_2 || ''}
              onChange={(e) => updateField('adresse_2', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Code postal</label>
            <input
              type="text"
              value={form.cp || ''}
              onChange={(e) => updateField('cp', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Ville</label>
            <input
              type="text"
              value={form.ville || ''}
              onChange={(e) => updateField('ville', e.target.value.toUpperCase())}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Departement</label>
            <input
              type="text"
              value={form.departement || ''}
              onChange={(e) => updateField('departement', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Pays</label>
            <select
              value={form.pays_id || ''}
              onChange={(e) => updateField('pays_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="input-field"
            >
              <option value="">Selectionner</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Commercial info */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <h3 className="text-lg font-semibold text-[--k-text] mb-4">Informations commerciales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Type commercial</label>
            <select
              value={form.type_commercial || ''}
              onChange={(e) => updateField('type_commercial', e.target.value || undefined)}
              className="input-field"
            >
              <option value="">Selectionner</option>
              <option value="client">Client</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Groupe client</label>
            <select
              value={form.groupe_client_id || ''}
              onChange={(e) => updateField('groupe_client_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="input-field"
            >
              <option value="">Selectionner</option>
              {groupes.map((g) => (
                <option key={g.id} value={g.id}>{g.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Source du lead</label>
            <select
              value={form.source_lead_id || ''}
              onChange={(e) => updateField('source_lead_id', e.target.value ? parseInt(e.target.value) : undefined)}
              className="input-field"
            >
              <option value="">Selectionner</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Raison du contact</label>
            <select
              value={form.contact_raison || ''}
              onChange={(e) => updateField('contact_raison', e.target.value || undefined)}
              className="input-field"
            >
              <option value="">Selectionner</option>
              <option value="event">Evenement</option>
              <option value="achat">Achat</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sectors */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <h3 className="text-lg font-semibold text-[--k-text] mb-4">Secteurs d'activite</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {secteurs.map((s) => (
            <label
              key={s.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition text-sm ${
                form.sectorIds?.includes(s.id)
                  ? 'bg-[--k-primary-2] text-[--k-primary] border border-[--k-primary-border]'
                  : 'bg-[--k-surface-2] text-[--k-muted] border border-transparent hover:brightness-95'
              }`}
            >
              <input
                type="checkbox"
                checked={form.sectorIds?.includes(s.id) || false}
                onChange={() => toggleSector(s.id)}
                className="rounded border-[--k-border]"
              />
              {s.nom}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <h3 className="text-lg font-semibold text-[--k-text] mb-4">Notes</h3>
        <textarea
          rows={4}
          value={form.note || ''}
          onChange={(e) => updateField('note', e.target.value)}
          placeholder="Notes internes sur ce client..."
          className="input-field resize-none"
          style={{ height: 'auto', minHeight: '100px' }}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-[--k-primary] text-white text-sm font-medium rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm shadow-[var(--k-primary)]/20"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
