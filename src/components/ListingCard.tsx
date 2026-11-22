import { MessageCircle, Phone, ArrowUpRight, Building2 } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES } from '../data/huilaCatalog';
import { ServiceListing } from '../types/marketplace';
import { buildContactLinks } from '../utils/geoValidation';

interface ListingCardProps {
  listing: ServiceListing;
  onOpenProfile: (listing: ServiceListing) => void;
  onTrackClick: (id: string, type: 'call' | 'whatsapp' | 'view') => void;
}

const SERVICE_MODE_LABELS: Record<ServiceListing['serviceMode'], string> = {
  estabelecimento: 'Estabelecimento local',
  domicilio: 'Ao domicílio',
  deslocacao: 'Por deslocação',
  hibrido: 'Loja e domicílio',
};

export function ListingCard({ listing, onOpenProfile, onTrackClick }: ListingCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const categoryName =
    CATEGORIES.find((c) => c.id === listing.category)?.name || listing.category;
  const { telHref, whatsappHref } = buildContactLinks(
    listing.phone,
    listing.whatsapp,
    listing.name
  );

  const isPremium = listing.planTier === 'premium';

  return (
    <article
      className={`group flex flex-col justify-between overflow-hidden rounded-xl border bg-[#121216] transition-transform duration-200 hover:-translate-y-0.5 ${
        isPremium
          ? 'border-[#D4AF37]/35 hover:border-[#D4AF37]/70'
          : 'border-white/[0.08] hover:border-white/20'
      }`}
    >
      <div>
        {/* Media Frame */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#18181D]">
          {!imgFailed ? (
            <img
              src={listing.coverImage}
              alt={`${listing.name} — ${categoryName} em ${listing.municipality}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1B1811] via-[#121216] to-[#09090B] p-6 text-center">
              <Building2 className="h-8 w-8 text-[#D4AF37]/70 mb-2" />
              <span className="text-xs font-medium text-[#A8A29E]">{listing.name}</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/25 to-transparent" />

          {/* Monogram Logo Mark */}
          <div className="absolute bottom-3 left-4 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold tracking-wide ${
                isPremium
                  ? 'border-[#D4AF37]/60 bg-[#09090B]/90 text-[#D4AF37]'
                  : 'border-white/20 bg-[#09090B]/90 text-[#F5F2EB]'
              }`}
            >
              {listing.logoText}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 pb-4">
          {/* Quiet unboxed kicker line (Zero-Pill Rule) */}
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
            {isPremium && (
              <>
                <span className="font-semibold text-[#D4AF37]">Destaque Patrocinado</span>
                <span aria-hidden="true" className="text-white/25">
                  ·
                </span>
              </>
            )}
            <span className="text-[#A8A29E]">
              {listing.entityType === 'independent' ? 'Profissional Independente' : 'Empresa Privada'}
            </span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span className="text-[#A8A29E]">{SERVICE_MODE_LABELS[listing.serviceMode]}</span>
          </div>

          <h3 className="text-base font-semibold leading-snug text-[#F5F2EB] line-clamp-1">
            {listing.name}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#A8A29E]">
            <span>{categoryName}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#E7E5E4] font-medium">{listing.municipality}</span>
            {listing.subcategory && (
              <>
                <span aria-hidden="true">·</span>
                <span>{listing.subcategory}</span>
              </>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#A8A29E] line-clamp-2">
            {listing.description}
          </p>
        </div>
      </div>

      {/* Quick Conversion Actions */}
      <div className="border-t border-white/[0.06] px-5 py-3.5 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={telHref}
            onClick={() => onTrackClick(listing.id, 'call')}
            aria-label={`Ligar Agora para ${listing.name}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#18181D] px-3 py-2 text-xs font-semibold text-[#F5F2EB] hover:border-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors whitespace-nowrap min-h-[40px]"
          >
            <Phone className="h-3.5 w-3.5" />
            Ligar Agora
          </a>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackClick(listing.id, 'whatsapp')}
            aria-label={`Contactar via WhatsApp ${listing.name}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 py-2 text-xs font-semibold text-[#09090B] hover:bg-[#E5C158] transition-colors whitespace-nowrap min-h-[40px]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </a>
        </div>

        <button
          type="button"
          onClick={() => {
            onTrackClick(listing.id, 'view');
            onOpenProfile(listing);
          }}
          aria-label={`Ver Perfil Completo de ${listing.name}`}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-[#D6D3D1] hover:border-[#D4AF37]/50 hover:text-[#F5F2EB] transition-colors whitespace-nowrap min-h-[40px]"
        >
          Ver Perfil Completo
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
