import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Loader2, Search, ChevronDown, Check } from 'lucide-react';
import { crmService, type DevisCreationData } from '../../services/crmService';

interface SelectOption {
  value: number | '';
  label: string;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '-- Sélectionner --',
}: {
  options: SelectOption[];
  value: number | '';
  onChange: (val: number | '') => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search) return options;
    const s = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(s));
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 rounded-xl border border-[var(--k-border)] bg-[var(--k-surface)] text-[var(--k-text)] text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[var(--k-primary)] transition"
      >
        <span className={selectedLabel ? '' : 'text-[var(--k-muted)]'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-[var(--k-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-[var(--k-surface)] border border-[var(--k-border)] rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--k-border)]">
            <Search className="w-3.5 h-3.5 text-[var(--k-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full text-sm bg-transparent text-[var(--k-text)] outline-none placeholder:text-[var(--k-muted)]"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--k-surface-2)] flex items-center justify-between ${value === '' ? 'text-[var(--k-primary)] font-medium' : 'text-[var(--k-muted)]'}`}
            >
              {placeholder}
              {value === '' && <Check className="w-3.5 h-3.5" />}
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value as number); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--k-surface-2)] flex items-center justify-between ${value === opt.value ? 'text-[var(--k-primary)] font-medium' : 'text-[var(--k-text)]'}`}
              >
                {opt.label}
                {value === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-sm text-[var(--k-muted)] text-center">Aucun résultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CreateDevisModalProps {
  isOpen: boolean;
  clientId: number;
  clientNom: string;
  onClose: () => void;
}

export default function CreateDevisModal({ isOpen, clientId, clientNom, onClose }: CreateDevisModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DevisCreationData | null>(null);

  // Form state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [selectedSousCategoryId, setSelectedSousCategoryId] = useState<number | ''>('');
  const [selectedModelDevisId, setSelectedModelDevisId] = useState<number | ''>('');
  const [categorieTarifaire, setCategorieTarifaire] = useState('ht');
  const [typeDocId, setTypeDocId] = useState<number | ''>('');

  // Charger les données de référence à l'ouverture
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    crmService.getDevisCreationData()
      .then((result) => {
        setData(result);
        if (result.typeDocs.length > 0) {
          setTypeDocId(result.typeDocs[0].id);
        }
      })
      .catch(() => {
        setError('Impossible de charger les données. Vérifiez la connexion au CRM.');
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Reset form quand on ferme
  useEffect(() => {
    if (!isOpen) {
      setSelectedCategoryId('');
      setSelectedSousCategoryId('');
      setSelectedModelDevisId('');
      setCategorieTarifaire('ht');
      setTypeDocId('');
    }
  }, [isOpen]);

  // Filtrer les sous-catégories par catégorie sélectionnée
  const filteredSousCategories = useMemo(() => {
    if (!data || !selectedCategoryId) return [];
    return data.modelSousCategories.filter(
      (sc) => sc.modele_devis_categories_id === selectedCategoryId
    );
  }, [data, selectedCategoryId]);

  // Filtrer les modèles de devis par catégorie et sous-catégorie
  const filteredModelDevis = useMemo(() => {
    if (!data) return [];
    let models = data.modelDevis;
    if (selectedCategoryId) {
      models = models.filter((m) => m.modele_devis_categories_id === selectedCategoryId);
    }
    if (selectedSousCategoryId) {
      models = models.filter((m) => m.modele_devis_sous_categories_id === selectedSousCategoryId);
    }
    return models;
  }, [data, selectedCategoryId, selectedSousCategoryId]);

  // Reset sous-catégorie et modèle quand la catégorie change
  useEffect(() => {
    setSelectedSousCategoryId('');
    setSelectedModelDevisId('');
  }, [selectedCategoryId]);

  // Reset modèle quand la sous-catégorie change
  useEffect(() => {
    setSelectedModelDevisId('');
  }, [selectedSousCategoryId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await crmService.createDevis({
        client_id: clientId,
        model_devis_id: selectedModelDevisId || null,
        categorie_tarifaire: categorieTarifaire,
        type_doc_id: typeDocId || null,
      });

      if (result.success && result.editUrl) {
        const crmBaseUrl = import.meta.env.VITE_CRM_URL || 'https://crm.konitys.fr';
        const fullUrl = crmBaseUrl + result.editUrl;
        const w = Math.min(1200, window.screen.width - 100);
        const h = Math.min(800, window.screen.height - 100);
        const left = (window.screen.width - w) / 2;
        const top = (window.screen.height - h) / 2;
        window.open(fullUrl, 'devisEditor', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
        onClose();
      }
    } catch {
      setError('Erreur lors de la création du devis.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectClass =
    'w-full px-3 py-2 rounded-xl border border-[var(--k-border)] bg-[var(--k-surface)] text-[var(--k-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--k-primary)] transition';

  // Options pour les SearchableSelect
  const categoryOptions: SelectOption[] = data?.modelCategories.map((c) => ({ value: c.id, label: c.name })) || [];
  const sousCategoryOptions: SelectOption[] = filteredSousCategories.map((sc) => ({ value: sc.id, label: sc.name }));
  const modelDevisOptions: SelectOption[] = filteredModelDevis.map((m) => ({ value: m.id, label: m.model_name }));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)]" onClick={onClose} />
      <div className="relative bg-[var(--k-surface)] rounded-2xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--k-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--k-primary)] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--k-text)]">Nouveau devis</h2>
              <p className="text-xs text-[var(--k-muted)]">{clientNom}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--k-surface-2)] transition"
          >
            <X className="w-5 h-5 text-[var(--k-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[var(--k-primary)] animate-spin" />
              <span className="ml-3 text-sm text-[var(--k-muted)]">Chargement...</span>
            </div>
          ) : error && !data ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--k-danger)]">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  crmService.getDevisCreationData()
                    .then((result) => { setData(result); if (result.typeDocs.length > 0) setTypeDocId(result.typeDocs[0].id); })
                    .catch(() => setError('Impossible de charger les données.'))
                    .finally(() => setLoading(false));
                }}
                className="mt-3 text-sm text-[var(--k-primary)] hover:underline"
              >
                Réessayer
              </button>
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Catégorie modèle */}
              {categoryOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[var(--k-muted)] mb-1.5">
                    Catégorie de modèle
                  </label>
                  <SearchableSelect
                    options={categoryOptions}
                    value={selectedCategoryId}
                    onChange={setSelectedCategoryId}
                    placeholder="-- Toutes les catégories --"
                  />
                </div>
              )}

              {/* Sous-catégorie modèle */}
              {selectedCategoryId && sousCategoryOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[var(--k-muted)] mb-1.5">
                    Sous-catégorie
                  </label>
                  <SearchableSelect
                    options={sousCategoryOptions}
                    value={selectedSousCategoryId}
                    onChange={setSelectedSousCategoryId}
                    placeholder="-- Toutes les sous-catégories --"
                  />
                </div>
              )}

              {/* Modèle de devis */}
              {filteredModelDevis.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[var(--k-muted)] mb-1.5">
                    Modèle de devis
                  </label>
                  <SearchableSelect
                    options={modelDevisOptions}
                    value={selectedModelDevisId}
                    onChange={setSelectedModelDevisId}
                    placeholder="-- Sans modèle --"
                  />
                </div>
              )}

              {/* Catégorie tarifaire */}
              {data.categorieTarifaires.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[var(--k-muted)] mb-1.5">
                    Catégorie tarifaire
                  </label>
                  <select
                    value={categorieTarifaire}
                    onChange={(e) => setCategorieTarifaire(e.target.value)}
                    className={selectClass}
                  >
                    {data.categorieTarifaires.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type de document */}
              {data.typeDocs.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[var(--k-muted)] mb-1.5">
                    Type de document
                  </label>
                  <select
                    value={typeDocId}
                    onChange={(e) => setTypeDocId(e.target.value ? Number(e.target.value) : '')}
                    className={selectClass}
                  >
                    {data.typeDocs.map((td) => (
                      <option key={td.id} value={td.id}>{td.nom}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <p className="text-sm text-[var(--k-danger)]">{error}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {data && (
          <div className="px-6 py-4 border-t border-[var(--k-border)] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[var(--k-muted)] bg-[var(--k-surface-2)] rounded-xl hover:brightness-95 transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-[var(--k-primary)] rounded-xl hover:brightness-110 transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer le devis
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
