import { useEffect, useState } from 'react';
import { Save, Building2, User, Plus, Trash2 } from 'lucide-react';
import { useClientStore } from '@/stores/clientStore';
import { ADDRESS_LABEL_SUGGESTIONS, type ClientAddressFormData, type ClientFormData } from '@/types/client';

const ADDRESS_LABEL_LIST_ID = 'client-form-address-labels';

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

  const addresses = form.addresses ?? [];

  const setAddresses = (next: ClientAddressFormData[]) => updateField('addresses', next);

  const addAddress = () => {
    // La première adresse est principale d'office, comme côté serveur.
    setAddresses([...addresses, { label: '', isPrimary: addresses.length === 0 }]);
  };

  const updateAddress = (index: number, field: keyof ClientAddressFormData, value: string) => {
    setAddresses(addresses.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const setPrimaryAddress = (index: number) => {
    setAddresses(addresses.map((a, i) => ({ ...a, isPrimary: i === index })));
  };

  const removeAddress = (index: number) => {
    const next = addresses.filter((_, i) => i !== index);
    // Retirer la principale laisserait la liste sans défaut : on promeut la première.
    if (next.length > 0 && !next.some((a) => a.isPrimary)) next[0] = { ...next[0], isPrimary: true };
    setAddresses(next);
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

      {/* Addresses */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[--k-text]">Adresses</h3>
            <p className="text-[12px] text-[--k-muted] mt-0.5">
              Nommez chaque adresse (Principale, Bureau, Livraison…). L'adresse principale
              est celle reprise sur la fiche client.
            </p>
          </div>
          <button
            type="button"
            onClick={addAddress}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[--k-primary] bg-[--k-primary-2] rounded-lg hover:brightness-95 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une adresse
          </button>
        </div>

        <datalist id={ADDRESS_LABEL_LIST_ID}>
          {ADDRESS_LABEL_SUGGESTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        {addresses.length === 0 ? (
          <p className="text-[13px] text-[--k-muted]">
            Aucune adresse. Utilisez « Ajouter une adresse » pour en saisir une.
          </p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr, index) => (
              <div
                key={index}
                className={`rounded-xl border p-3 space-y-2 ${
                  addr.isPrimary
                    ? 'border-[--k-primary-border] bg-[--k-primary-2]/30'
                    : 'border-[--k-border] bg-[--k-surface-2]/40'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Nom de l'adresse</label>
                    <input
                      type="text"
                      list={ADDRESS_LABEL_LIST_ID}
                      value={addr.label || ''}
                      maxLength={100}
                      placeholder="Principale, Bureau…"
                      onChange={(e) => updateAddress(index, 'label', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Adresse</label>
                    <input
                      type="text"
                      value={addr.adresse || ''}
                      maxLength={255}
                      onChange={(e) => updateAddress(index, 'adresse', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Complement d'adresse</label>
                  <input
                    type="text"
                    value={addr.adresse2 || ''}
                    maxLength={255}
                    onChange={(e) => updateAddress(index, 'adresse2', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Code postal</label>
                    <input
                      type="text"
                      value={addr.cp || ''}
                      maxLength={20}
                      onChange={(e) => updateAddress(index, 'cp', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-[--k-muted] mb-1">Ville</label>
                    <input
                      type="text"
                      value={addr.ville || ''}
                      maxLength={120}
                      onChange={(e) => updateAddress(index, 'ville', e.target.value.toUpperCase())}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-[12px] text-[--k-text] cursor-pointer">
                    <input
                      type="radio"
                      name="primary-address"
                      checked={!!addr.isPrimary}
                      onChange={() => setPrimaryAddress(index)}
                      className="border-[--k-border]"
                    />
                    Adresse principale
                  </label>
                  <button
                    type="button"
                    onClick={() => removeAddress(index)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-[--k-muted] rounded-lg hover:bg-red-50 hover:text-[--k-danger] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Retirer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Localisation */}
      <div className="bg-[--k-surface] rounded-2xl shadow-sm shadow-black/[0.03] border border-[--k-border] p-6">
        <h3 className="text-lg font-semibold text-[--k-text] mb-4">Localisation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
