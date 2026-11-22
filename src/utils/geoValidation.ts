import { HUILA_MUNICIPALITIES } from '../data/huilaCatalog';
import {
  CategoryId,
  EntityType,
  GeoValidationDecision,
  GeoValidationInput,
  ServiceListing,
} from '../types/marketplace';

const GOVERNMENT_KEYWORDS = [
  'ministério',
  'ministerio',
  'governo provincial',
  'administração municipal',
  'administracao municipal',
  'repartição pública',
  'reparticao publica',
  'serviço público estatal',
  'servico publico estatal',
  'hospital geral do estado',
  'escola pública estatal',
  'escola publica estatal',
  'polícia nacional',
  'policia nacional',
  'delegação provincial',
  'delegacao provincial',
  'direcção provincial',
  'direccao provincial',
  'tribunal provincial',
  'conservatória',
  'conservatoria',
  'agt ',
  'sme ',
  'inss ',
];

const OUTSIDE_HUILA_REGIONS = [
  'luanda',
  'talatona',
  'viana',
  'kilamba',
  'cazenga',
  'benguela',
  'lobito',
  'huambo',
  'namibe',
  'moçâmedes',
  'mocamedes',
  'cunene',
  'ondjiva',
  'cabinda',
  'malanje',
  'uíge',
  'uige',
  'bié',
  'bie',
  'kuando kubango',
  'cuando cubango',
  'moxico',
  'lunda norte',
  'lunda sul',
  'zaire',
  'bengo',
  'cuanza norte',
  'cuanza sul',
  'lisboa',
  'porto',
  'madrid',
  'windhoek',
];

// Approximate bounding box covering Província da Huíla, Angola
const HUILA_BOUNDS = {
  minLat: -16.6,
  maxLat: -13.2,
  minLng: 13.1,
  maxLng: 16.9,
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function detectGovernmentService(name: string, description: string): boolean {
  const combined = ` ${normalizeText(name)} ${normalizeText(description)} `;
  return GOVERNMENT_KEYWORDS.some((kw) => combined.includes(normalizeText(kw)));
}

export function isOfficialHuilaMunicipality(municipality: string): boolean {
  const target = normalizeText(municipality);
  return HUILA_MUNICIPALITIES.some((m) => normalizeText(m) === target);
}

export function containsOutsideHuilaLocation(text?: string): string | null {
  if (!text) return null;
  const normalized = normalizeText(text);
  for (const region of OUTSIDE_HUILA_REGIONS) {
    const cleanRegion = normalizeText(region).trim();
    const regex = new RegExp(`(^|[^a-z])${cleanRegion}([^a-z]|$)`, 'i');
    if (regex.test(normalized)) {
      return region.trim();
    }
  }
  return null;
}

export function isImpreciseHint(hint?: string): boolean {
  if (!hint) return false;
  const normalized = normalizeText(hint);
  return (
    normalized.includes('imprecis') ||
    normalized.includes('sem referencia') ||
    normalized.includes('sem sinal') ||
    normalized.includes('desconhecid') ||
    normalized.includes('nao confirmado')
  );
}

export function isWithinHuilaCoordinates(lat?: number, lng?: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  return (
    lat >= HUILA_BOUNDS.minLat &&
    lat <= HUILA_BOUNDS.maxLat &&
    lng >= HUILA_BOUNDS.minLng &&
    lng <= HUILA_BOUNDS.maxLng
  );
}

export function evaluateGeoValidation(input: GeoValidationInput): GeoValidationDecision {
  // 1. Strict non-government rule
  if (!input.declaredNotGovernment || detectGovernmentService(input.name, input.description)) {
    return {
      status: 'rejected',
      method: 'government_blocked',
      isGovernmentBlocked: true,
      reason:
        'Cadastro bloqueado: O Omuwa-Huíla aceita apenas empresas privadas e profissionais independentes. Serviços prestados pelo governo não são permitidos.',
    };
  }

  // 2. Anti-fraud check on selected municipality
  if (!isOfficialHuilaMunicipality(input.municipality)) {
    return {
      status: 'rejected',
      method: 'outside_huila_blocked',
      isGovernmentBlocked: false,
      reason: `Município "${input.municipality}" não pertence à lista oficial dos 14 municípios da Província da Huíla.`,
    };
  }

  // 3. Anti-fraud check on localityHint / address reference pointing outside Huíla (Test #02)
  const outsideMatch = containsOutsideHuilaLocation(input.localityHint);
  if (outsideMatch) {
    return {
      status: 'rejected',
      method: 'outside_huila_blocked',
      isGovernmentBlocked: false,
      reason: `Bloqueio geográfico anti-fraude: A referência "${input.localityHint}" indica localização fora da Província da Huíla (${outsideMatch}). O diretório é exclusivo para a Huíla.`,
    };
  }

  // 4. Imprecise hint check before / alongside Geocoding (Test #03)
  if (isImpreciseHint(input.localityHint)) {
    return {
      status: 'pending_review',
      method: 'imprecise_manual_review',
      isGovernmentBlocked: false,
      reason:
        'Endereço ou referência imprecisa. A conta foi encaminhada para Análise Administrativa antes da publicação.',
    };
  }

  // 5. Evaluate Google Maps Geocoding API response
  const geo = input.geocodingResult;
  if (!geo || geo.networkError || !geo.ok) {
    return {
      status: 'pending_review',
      method: 'imprecise_manual_review',
      isGovernmentBlocked: false,
      reason:
        'Não foi possível confirmar automaticamente via Google Maps Geocoding API. Registo encaminhado para Revisão Manual Administrativa.',
    };
  }

  const formattedNorm = normalizeText(geo.formattedAddress || '');
  const adminNorm = normalizeText(geo.administrativeArea || '');
  const countryNorm = (geo.countryCode || '').toUpperCase();

  // Check if Geocoding returned a location explicitly outside Angola or outside Huíla
  if (countryNorm && countryNorm !== 'AO') {
    return {
      status: 'rejected',
      method: 'outside_huila_blocked',
      isGovernmentBlocked: false,
      formattedAddress: geo.formattedAddress,
      placeId: geo.placeId,
      reason: `Localização validada fora de Angola (${geo.formattedAddress || countryNorm}). Exclusivo para a Província da Huíla.`,
    };
  }

  const adminOutside = containsOutsideHuilaLocation(geo.administrativeArea || geo.formattedAddress);
  if (adminOutside && !formattedNorm.includes('huila') && !adminNorm.includes('huila')) {
    return {
      status: 'rejected',
      method: 'outside_huila_blocked',
      isGovernmentBlocked: false,
      formattedAddress: geo.formattedAddress,
      placeId: geo.placeId,
      reason: `Localização identificada fora da Província da Huíla (${geo.formattedAddress || adminOutside}). Cadastro bloqueado.`,
    };
  }

  const confirmedHuila =
    adminNorm.includes('huila') ||
    formattedNorm.includes('huila') ||
    isWithinHuilaCoordinates(geo.lat, geo.lng);

  if (confirmedHuila) {
    return {
      status: 'approved',
      method: 'google_geocoding_verified',
      isGovernmentBlocked: false,
      formattedAddress: geo.formattedAddress || `${input.municipality}, Província da Huíla, Angola`,
      placeId: geo.placeId,
      reason: `Localização confirmada na Província da Huíla (${input.municipality}). Aprovação automática concluída.`,
    };
  }

  // Ambiguous / imprecise geocoding result -> Manual Admin Review
  return {
    status: 'pending_review',
    method: 'imprecise_manual_review',
    isGovernmentBlocked: false,
    formattedAddress: geo.formattedAddress,
    placeId: geo.placeId,
    reason:
      'Localização sem confirmação exata da Província da Huíla pelo Google Maps. Encaminhado para Análise Administrativa.',
  };
}

export interface ListingFilterCriteria {
  query?: string;
  municipality?: string;
  category?: CategoryId | 'all';
  entityType?: EntityType | 'all';
  onlyApproved?: boolean;
}

export function filterListings(
  listings: ServiceListing[],
  criteria: ListingFilterCriteria
): ServiceListing[] {
  const q = normalizeText(criteria.query || '');
  const municipality = criteria.municipality || 'all';
  const category = criteria.category || 'all';
  const entityType = criteria.entityType || 'all';
  const onlyApproved = criteria.onlyApproved ?? true;

  return listings.filter((item) => {
    if (onlyApproved && item.status !== 'approved') return false;
    if (category !== 'all' && item.category !== category) return false;
    if (entityType !== 'all' && item.entityType !== entityType) return false;
    if (municipality !== 'all') {
      const matchesPrimary = normalizeText(item.municipality) === normalizeText(municipality);
      const matchesCoverage = item.coverageAreas.some(
        (area) => normalizeText(area) === normalizeText(municipality)
      );
      if (!matchesPrimary && !matchesCoverage) return false;
    }
    if (q) {
      const haystack = normalizeText(
        `${item.name} ${item.description} ${item.subcategory} ${item.municipality} ${item.requirementValue} ${item.coverageAreas.join(' ')}`
      );
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function sortFeaturedListings(listings: ServiceListing[]): ServiceListing[] {
  return [...listings]
    .filter((item) => item.status === 'approved' && item.planTier === 'premium')
    .sort((a, b) => {
      if (a.adOrder !== b.adOrder) return a.adOrder - b.adOrder;
      return b.popularScore - a.popularScore;
    });
}

export function buildContactLinks(phone: string, whatsapp: string, businessName: string) {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const cleanWa = whatsapp.replace(/\D/g, '');
  const normalizedWa = cleanWa.startsWith('244') ? cleanWa : `244${cleanWa}`;
  const message = encodeURIComponent(
    `Olá! Encontrei o serviço "${businessName}" no Omuwa-Huíla e gostaria de mais informações.`
  );
  return {
    telHref: `tel:${cleanPhone.startsWith('+') ? cleanPhone : `+244${cleanPhone}`}`,
    whatsappHref: `https://wa.me/${normalizedWa}?text=${message}`,
  };
}
