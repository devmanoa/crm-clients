import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { loadGooglePlaces, parsePlace, type ParsedAddress } from '@/lib/googleMaps';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Appelé uniquement quand une adresse est choisie dans la liste Google. */
  onPlaceSelected: (parsed: ParsedAddress) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  id?: string;
}

/**
 * Champ « rue » avec autocomplétion Google Places. La sélection d'une
 * proposition renvoie l'adresse découpée (CP, ville, département…) au parent,
 * qui décide des champs à pré-remplir.
 *
 * Sans clé API configurée, ou si le script Google ne se charge pas, le champ
 * reste un input libre : la saisie manuelle n'est jamais bloquée.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  placeholder,
  maxLength = 255,
  className = 'input-field',
  id,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Les handlers changent à chaque rendu ; on les lit via des refs pour ne pas
  // avoir à détacher/rattacher l'Autocomplete de Google à chaque frappe.
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;
    let listener: google.maps.MapsEventListener | null = null;

    loadGooglePlaces().then((places) => {
      if (cancelled || !places || !inputRef.current) return;

      const autocomplete = new places.Autocomplete(inputRef.current, {
        // address seul écarte les POI (restaurants, magasins) : on veut des
        // adresses postales. geocode élargirait aux villes sans numéro.
        types: ['address'],
        fields: ['address_components', 'geometry', 'name', 'formatted_address'],
      });

      listener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place?.address_components) return; // saisie libre validée par Entrée

        const parsed = parsePlace(place);
        // On remonte d'abord la rue, puis le reste : le parent reçoit un état
        // cohérent même s'il ne réagit qu'à onPlaceSelected.
        onChangeRef.current(parsed.adresse);
        onPlaceSelectedRef.current(parsed);
      });

      autocompleteRef.current = autocomplete;
      setIsReady(true);
    });

    return () => {
      cancelled = true;
      if (listener) listener.remove();
      // Google laisse son conteneur de suggestions dans le DOM ; il se recycle
      // au montage suivant, rien à nettoyer de plus ici.
      autocompleteRef.current = null;
    };
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Entrée sur une suggestion ne doit pas soumettre le formulaire.
          if (e.key === 'Enter') e.preventDefault();
        }}
        autoComplete="off"
        className={isReady ? `${className} pr-8` : className}
      />
      {isReady && (
        <MapPin
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[--k-muted]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
