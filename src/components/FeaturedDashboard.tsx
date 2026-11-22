import { Calendar, Megaphone, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../data/huilaCatalog';
import { FeaturedNewsItem, ServiceListing } from '../types/marketplace';
import { ListingCard } from './ListingCard';

interface FeaturedDashboardProps {
  featuredListings: ServiceListing[];
  newsItems: FeaturedNewsItem[];
  allApproved: ServiceListing[];
  onOpenProfile: (listing: ServiceListing) => void;
  onTrackClick: (id: string, type: 'call' | 'whatsapp' | 'view') => void;
  onOpenListingById: (id: string) => void;
  onOpenRegisterPremium: () => void;
}

export function FeaturedDashboard({
  featuredListings,
  newsItems,
  allApproved,
  onOpenProfile,
  onTrackClick,
  onOpenListingById,
  onOpenRegisterPremium,
}: FeaturedDashboardProps) {
  const highlightedNews = newsItems.filter((n) => n.isHighlighted);
  const popularCount = allApproved.filter((l) => l.popularScore >= 80).length;

  return (
    <section id="destaques" className="border-b border-white/[0.08] py-12 md:py-16">
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        {/* Section Header + Clean Metric Summary Strip */}
        <div className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
              Dashboard em Destaque
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl [text-wrap:balance]">
              Empresas e Profissionais em Destaque
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#A8A29E]">
              Parceiros com Plano Premium ativo na Província da Huíla, com contacto direto imediato
              e transparência de patrocínio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <div className="font-mono-tabular text-xl font-semibold text-[#F5F2EB]">
                {featuredListings.length}
              </div>
              <div className="text-xs text-[#A8A29E]">Destaques ativos</div>
            </div>
            <div className="h-8 w-px bg-white/10" aria-hidden="true" />
            <div>
              <div className="font-mono-tabular text-xl font-semibold text-[#F5F2EB]">
                {popularCount}
              </div>
              <div className="text-xs text-[#A8A29E]">Serviços populares</div>
            </div>
            <div className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden="true" />
            <button
              type="button"
              onClick={onOpenRegisterPremium}
              className="rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#09090B] transition-colors whitespace-nowrap"
            >
              Destacar meu serviço
            </button>
          </div>
        </div>

        {/* Premium Featured Listings Grid */}
        {featuredListings.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {featuredListings.slice(0, 4).map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onOpenProfile={onOpenProfile}
                onTrackClick={onTrackClick}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-white/[0.08] bg-[#121216] p-8 text-center">
            <p className="text-sm text-[#D6D3D1]">
              Ainda não existem serviços em destaque patrocinado publicados.
            </p>
            <p className="mt-1 text-xs text-[#A8A29E]">
              Cadastre a sua empresa ou atividade independente com o Plano Premium para figurar
              neste painel.
            </p>
          </div>
        )}

        {/* Novidades em Destaque Dashboard Strip */}
        <div id="novidades" className="mt-14 pt-10 border-t border-white/[0.08]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-[#D4AF37]">
                <Megaphone className="h-3.5 w-3.5" />
                Novidades &amp; Lançamentos na Huíla
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#F5F2EB]">
                Novidades em Destaque
              </h2>
            </div>
            <p className="text-xs text-[#A8A29E]">
              Atualizações recentes de serviços, horários e expansões intermunicipais
            </p>
          </div>

          {highlightedNews.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {highlightedNews.map((news) => {
                const catName =
                  CATEGORIES.find((c) => c.id === news.category)?.name || news.category;
                return (
                  <article
                    key={news.id}
                    className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#121216] p-5 hover:border-[#D4AF37]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                        <span className="font-medium text-[#D4AF37]">{news.tag}</span>
                        <span aria-hidden="true">·</span>
                        <span>{news.municipality}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono-tabular">
                          <Calendar className="h-3 w-3" />
                          {news.publishedAt}
                        </span>
                      </div>
                      <h3 className="mt-2.5 text-base font-semibold leading-snug text-[#F5F2EB]">
                        {news.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#A8A29E]">{news.summary}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-xs">
                      <span className="text-[#78716C]">{catName}</span>
                      {news.relatedListingId && (
                        <button
                          type="button"
                          onClick={() => onOpenListingById(news.relatedListingId!)}
                          className="inline-flex items-center gap-1 font-semibold text-[#D4AF37] hover:underline"
                        >
                          <Sparkles className="h-3 w-3" />
                          Ver serviço relacionado
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#121216] p-8 text-center">
              <p className="text-sm text-[#D6D3D1]">
                Sem novidades publicadas neste momento.
              </p>
              <p className="mt-1 text-xs text-[#A8A29E]">
                As atualizações e lançamentos de empresas da Província da Huíla aparecerão aqui
                assim que forem publicados pela administração.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
