export type UserRole = 'admin' | 'gestor' | 'user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type CategoryId =
  | 'comercio'
  | 'alimentacao_alojamento'
  | 'construcao_manutencao'
  | 'saude_bem_estar'
  | 'educacao_formacao'
  | 'transportes_logistica'
  | 'tecnologia_servicos'
  | 'trabalhadores_independentes';

export type EntityType = 'company' | 'independent';

export type ServiceMode = 'estabelecimento' | 'domicilio' | 'deslocacao' | 'hibrido';

export type PlanTier = 'normal' | 'premium';

export type ListingStatus = 'approved' | 'pending_review' | 'rejected' | 'suspended';

export type PaymentStatus = 'paid' | 'pending' | 'expired' | 'free';

export type GeoVerificationMethod =
  | 'google_geocoding_verified'
  | 'outside_huila_blocked'
  | 'imprecise_manual_review'
  | 'government_blocked'
  | 'admin_manual_override';

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  subcategories: string[];
  profileRequirementLabel: string;
  profileRequirementPlaceholder: string;
  defaultCoverImage: string;
}

export interface ServiceListing {
  id: string;
  ownerUserId?: string;
  name: string;
  entityType: EntityType;
  category: CategoryId;
  subcategory: string;
  municipality: string;
  localityHint?: string;
  serviceMode: ServiceMode;
  coverageAreas: string[];
  description: string;
  requirementLabel: string;
  requirementValue: string;
  phone: string;
  whatsapp: string;
  planTier: PlanTier;
  status: ListingStatus;
  paymentStatus: PaymentStatus;
  adOrder: number;
  adDurationDays: number;
  coverImage: string;
  logoText: string;
  popularScore: number;
  isRecommended: boolean;
  geoVerification: {
    method: GeoVerificationMethod;
    reason: string;
    formattedAddress?: string;
    placeId?: string;
    verifiedAt: string;
  };
  metrics: {
    views: number;
    callClicks: number;
    whatsappClicks: number;
  };
  createdAt: string;
}

export interface FeaturedNewsItem {
  id: string;
  title: string;
  summary: string;
  category: CategoryId;
  municipality: string;
  relatedListingId?: string;
  relatedListingName?: string;
  isHighlighted: boolean;
  publishedAt: string;
  tag: string;
}

export type TestimonialAuthorRole = 'Cliente' | 'Empresa Parceira' | 'Profissional Independente';

export interface UserTestimonial {
  id: string;
  authorName: string;
  authorRole: TestimonialAuthorRole;
  municipality: string;
  rating: number;
  serviceContext?: string;
  comment: string;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminMetrics {
  totalActiveListings: number;
  totalCompanies: number;
  totalIndependents: number;
  pendingReviewCount: number;
  premiumActiveCount: number;
  totalSearches: number;
  totalCallClicks: number;
  totalWhatsappClicks: number;
  totalProfileViews: number;
  geocodingDailyCount: number;
  geocodingDailyLimit: number;
  geocodingCacheEntries: number;
  geocodingCacheHits: number;
}

export interface GeoValidationInput {
  name: string;
  description: string;
  municipality: string;
  localityHint?: string;
  declaredNotGovernment: boolean;
  geocodingResult?: {
    ok: boolean;
    quotaExceeded?: boolean;
    networkError?: boolean;
    formattedAddress?: string;
    administrativeArea?: string;
    countryCode?: string;
    granularity?: string;
    placeId?: string;
    lat?: number;
    lng?: number;
  };
}

export interface GeoValidationDecision {
  status: ListingStatus;
  method: GeoVerificationMethod;
  reason: string;
  formattedAddress?: string;
  placeId?: string;
  isGovernmentBlocked: boolean;
}
