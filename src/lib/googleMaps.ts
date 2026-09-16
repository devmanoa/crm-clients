/**
 * Chargement paresseux du script Google Maps (bibliothèque Places).
 *
 * La clé d'une API Maps JS est nécessairement visible côté navigateur : elle se
 * protège par des restrictions de référent HTTP dans la console Google Cloud,
 * pas par le secret. Sans VITE_GOOGLE_MAPS_API_KEY, l'autocomplétion est
 * simplement désactivée et les champs restent saisissables à la main.
 */
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const isGoogleMapsConfigured = Boolean(API_KEY);

let loaderPromise: Promise<typeof google.maps.places | null> | null = null;

export function loadGooglePlaces(): Promise<typeof google.maps.places | null> {
  if (!API_KEY) return Promise.resolve(null);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve) => {
    // Script déjà présent (navigation entre pages, ou hub qui l'aurait chargé).
    if (window.google?.maps?.places) {
      resolve(window.google.maps.places);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-places]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google?.maps?.places ?? null));
      existing.addEventListener('error', () => resolve(null));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(API_KEY)}&libraries=places&language=fr&region=FR`;
    script.async = true;
    script.defer = true;
    script.dataset.googlePlaces = 'true';
    script.addEventListener('load', () => resolve(window.google?.maps?.places ?? null));
    script.addEventListener('error', () => {
      // Clé invalide, quota dépassé, réseau coupé : on retombe sur la saisie
      // manuelle plutôt que de bloquer le formulaire.
      loaderPromise = null;
      resolve(null);
    });
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export interface ParsedAddress {
  adresse: string;
  cp: string;
  ville: string;
  /** Code département français déduit du code postal, sinon chaîne vide. */
  departement: string;
  country: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
}

function component(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  short = false,
): string {
  const found = components.find((c) => c.types.includes(type));
  if (!found) return '';
  return short ? found.short_name : found.long_name;
}

/**
 * Département français à partir du code postal.
 * Corse : 20xxx se scinde en 2A / 2B, qu'un simple préfixe ne donne pas.
 * DOM-TOM : les codes à 97x/98x tiennent sur trois chiffres.
 *
 * `countryCode` évite de fabriquer un département depuis un code postal
 * étranger : « W1D 1BS » donnerait sinon un « 11 » qui fausserait le filtre.
 */
export function departementFromCp(cp: string, countryCode = 'FR'): string {
  if (countryCode && countryCode.toUpperCase() !== 'FR') return '';

  const raw = (cp || '').trim();
  // Un code postal français fait exactement 5 chiffres ; tout autre format
  // (lettres, longueur différente) n'est pas exploitable ici.
  if (!/^\d{2}[\s]?\d{3}$/.test(raw) && !/^\d{5}$/.test(raw)) return '';

  const digits = raw.replace(/\D/g, '');
  if (digits.length < 2) return '';

  if (digits.startsWith('97') || digits.startsWith('98')) return digits.slice(0, 3);

  const prefix = digits.slice(0, 2);
  if (prefix === '20') {
    const n = parseInt(digits.slice(0, 5), 10);
    if (!Number.isNaN(n)) return n < 20200 ? '2A' : '2B';
    return '20';
  }
  return prefix;
}

/** Traduit un PlaceResult Google en champs du formulaire. */
export function parsePlace(place: google.maps.places.PlaceResult): ParsedAddress {
  const components = place.address_components ?? [];

  const streetNumber = component(components, 'street_number');
  const route = component(components, 'route');
  // Google ne renvoie pas toujours street_number/route (lieux-dits, POI) :
  // on retombe sur le nom du lieu plutôt que de laisser la rue vide.
  const street = [streetNumber, route].filter(Boolean).join(' ').trim();
  const adresse = street || place.name || '';

  const cp = component(components, 'postal_code');
  const ville =
    component(components, 'locality') ||
    component(components, 'postal_town') ||
    component(components, 'administrative_area_level_2');
  const countryCode = component(components, 'country', true);

  return {
    adresse,
    cp,
    ville,
    departement: departementFromCp(cp, countryCode),
    country: component(components, 'country'),
    countryCode,
    latitude: place.geometry?.location?.lat(),
    longitude: place.geometry?.location?.lng(),
  };
}
