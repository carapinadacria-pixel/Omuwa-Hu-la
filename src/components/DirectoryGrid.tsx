import { useState } from 'react';
import { CATEGORIES } from '../data/huilaCatalog';
import { CategoryId, ServiceListing } from '../types/marketplace';
import { ListingCard } from './ListingCard';

type DynamicTab = 'todos' | 'populares' | 'recentes' | 'recomendados';

interface DirectoryGridProps {
  listings: ServiceListing[];
  isLoading: boolean;
  selectedCategory: CategoryId | 'all';
  onCategorySelect: (cat: CategoryId | 'all') => void;
  onOpenProfile: (listing: ServiceListing) => void;
  onTrackClick: (id: string, type: 'call' | 'whatsapp' | 'view') => void;
  onResetFilters: () => void;
  onOpenRegister: () => void;
}

export function DirectoryGrid({
  listings,
  isLoading,
  selectedCategory,
  onCategorySelect,
  onOpenProfile,
  onTrackClick,
  onResetFilters,
  onOpenRegister,
}: DirectoryGridProps) {
  const [activeTab, setActiveTab] = useState<DynamicTab>('todos');

  const orderedListings = (() => {
    const copy = [...listings];
    if (activeTab === 'populares') {
      return copy.sort((a, b) => b.popularScore - a.popularScore);
    }
    if (activeTab === 'recentes') {
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (activeTab === 'recomendados') {
      return copy.filter((l) => l.isRecommended);
    }
    // Default: Premium first by adOrder, then recent/popular
    return copy.sort((a, b) => {
      if (a.planTier === 'premium' && b.planTier !== 'premium') return -1;
      if (a.planTier !== 'premium' && b.planTier === 'premium') return 1;
      if (a.planTier === 'premium' && b.planTier === 'premium') {
        return a.adOrder - b.adOrder;
      }
      return b.popularScore - a.popularScore;
    });
  })();

  return (
    <section id="explorar" className="border-b border-white/[0.08] py-12 md:py-16">
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
              Catálogo Provincial Completo
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl">
              Explorar Empresas e Profissionais
            </h2>
          </div>

          {/* Dynamic Sections Segmented Tabs */}
          <div
            role="tablist"
            aria-label="Secções dinâmicas do diretório"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#121216] p-1"
          >
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'populares', label: 'Empresas Populares' },
                { id: 'recentes', label: 'Recém-Cadastrados' },
                { id: 'recomendados', label: 'Recomendados' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#D4AF37] text-[#09090B] font-semibold'
                    : 'text-[#A8A29E] hover:text-[#F5F2EB]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Categories Interactive Filter Strip */}
        <div
          aria-label="Filtrar por categoria principal"
          className="mt-6 flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-5"
        >
          <button
            type="button"
            onClick={() => onCategorySelect('all')}
            className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
              selectedCategory === 'all'
                ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                : 'border-white/10 bg-[#121216] text-[#A8A29E] hover:border-white/25 hover:text-[#F5F2EB]'
            }`}
          >
            Todas as Categorias
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategorySelect(cat.id)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                selectedCategory === cat.id
                  ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                  : 'border-white/10 bg-[#121216] text-[#A8A29E] hover:border-white/25 hover:text-[#F5F2EB]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mt-5 flex items-center justify-between text-xs text-[#A8A29E]">
          <span>
            <strong className="font-mono-tabular text-[#F5F2EB]">{orderedListings.length}</strong>{' '}
            {orderedListings.length === 1 ? 'prestador encontrado' : 'prestadores encontrados'} na
            Província da Huíla
          </span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[380px] rounded-xl border border-white/[0.08] bg-[#121216] p-5"
              >
                <div className="h-44 w-full rounded-lg bg-white/[0.04]" />
                <div className="mt-4 h-4 w-2/3 rounded bg-white/[0.06]" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.04]" />
                <div className="mt-6 h-10 w-full rounded-lg bg-white/[0.05]" />
              </div>
            ))}
          </div>
        ) : orderedListings.length > 0 ? (
          <div
            data-testid="directory-grid"
            className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {orderedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onOpenProfile={onOpenProfile}
                onTrackClick={onTrackClick}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-white/[0.08] bg-[#121216] p-10 text-center">
            <h3 className="text-base font-semibold text-[#F5F2EB]">
              Nenhum prestador encontrado com estes filtros
            </h3>
            <p className="mt-2 text-sm text-[#A8A29E]">
              Experimente selecionar outro município da Huíla ou limpar os filtros atuais.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={onResetFilters}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-[#F5F2EB] hover:border-[#D4AF37]"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={onOpenRegister}
                className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#09090B]"
              >
                Cadastrar primeiro serviço nesta categoria
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
