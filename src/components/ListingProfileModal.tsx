import { MapPin, MessageCircle, Phone, ShieldCheck, X } from 'lucide-react';
import { CATEGORIES } from '../data/huilaCatalog';
import { ServiceListing } from '../types/marketplace';
import { buildContactLinks } from '../utils/geoValidation';

interface ListingProfileModalProps {
  listing: ServiceListing | null;
  onClose: () => void;
  onTrackClick: (id: string, type: 'call' | 'whatsapp' | 'view') => void;
}

export function ListingProfileModal({
  listing,
  onClose,
  onTrackClick,
}: ListingProfileModalProps) {
  if (!listing) return null;

  const category = CATEGORIES.find((c) => c.id === listing.category);
  const { telHref, whatsappHref } = buildContactLinks(
    listing.phone,
    listing.whatsapp,
    listing.name
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#D4AF37]/30 bg-[#121216] text-[#F5F2EB]">
        {/* Header Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#18181D]">
          <img
            src={listing.coverImage}
            alt={listing.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/30 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar perfil do prestador"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#09090B]/85 text-[#F5F2EB] hover:border-[#D4AF37]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {listing.planTier === 'premium' && (
              <>
                <span className="font-semibold text-[#D4AF37]">Destaque Patrocinado</span>
                <span aria-hidden="true" className="text-white/25">
                  ·
                </span>
              </>
            )}
            <span className="text-[#A8A29E]">
              {listing.entityType === 'independent'
                ? 'Profissional Independente (Conta Própria)'
                : 'Empresa Privada'}
            </span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span className="text-[#A8A29E]">{category?.name}</span>
          </div>

          <h2
            id="profile-modal-title"
            className="mt-2 font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl"
          >
            {listing.name}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#D6D3D1]">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
              {listing.municipality}, Província da Huíla
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              {listing.geoVerification.reason}
            </span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-[#D6D3D1]">{listing.description}</p>

          {/* Structured Profile Details */}
          <dl className="mt-6 grid grid-cols-1 gap-4 border-y border-white/[0.08] py-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[#A8A29E]">{listing.requirementLabel}</dt>
              <dd className="mt-1 text-sm font-medium text-[#F5F2EB]">
                {listing.requirementValue}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#A8A29E]">Municípios de Atendimento</dt>
              <dd className="mt-1 text-sm font-medium text-[#F5F2EB]">
                {listing.coverageAreas.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#A8A29E]">Subcategoria</dt>
              <dd className="mt-1 text-sm font-medium text-[#F5F2EB]">{listing.subcategory}</dd>
            </div>
            <div>
              <dt className="text-xs text-[#A8A29E]">Interações no Diretório</dt>
              <dd className="mt-1 font-mono-tabular text-sm text-[#F5F2EB]">
                {listing.metrics.views} visualizações · {listing.metrics.whatsappClicks} contactos
                WhatsApp
              </dd>
            </div>
          </dl>

          {/* Conversion CTA Row */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={telHref}
              onClick={() => onTrackClick(listing.id, 'call')}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/20 bg-[#18181D] px-5 py-3 text-sm font-semibold text-[#F5F2EB] hover:border-[#D4AF37] min-h-[44px]"
            >
              <Phone className="h-4 w-4 text-[#D4AF37]" />
              Ligar Agora ({listing.phone})
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onTrackClick(listing.id, 'whatsapp')}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158] min-h-[44px]"
            >
              <MessageCircle className="h-4 w-4" />
              Contactar via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
