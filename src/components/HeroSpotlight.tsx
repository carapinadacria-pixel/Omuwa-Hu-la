import { Search, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, HERO_IMAGE, HUILA_MUNICIPALITIES } from '../data/huilaCatalog';
import { CategoryId, EntityType } from '../types/marketplace';

interface HeroSpotlightProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedMunicipality: string;
  onMunicipalityChange: (value: string) => void;
  selectedCategory: CategoryId | 'all';
  onCategoryChange: (value: CategoryId | 'all') => void;
  selectedEntityType: EntityType | 'all';
  onEntityTypeChange: (value: EntityType | 'all') => void;
  activeCount: number;
  onOpenRegister: () => void;
  onResetFilters: () => void;
}

export function HeroSpotlight({
  searchQuery,
  onSearchChange,
  selectedMunicipality,
  onMunicipalityChange,
  selectedCategory,
  onCategoryChange,
  selectedEntityType,
  onEntityTypeChange,
  activeCount,
  onOpenRegister,
  onResetFilters,
}: HeroSpotlightProps) {
  const hasFilters =
    searchQuery.trim() !== '' ||
    selectedMunicipality !== 'all' ||
    selectedCategory !== 'all' ||
    selectedEntityType !== 'all';

  return (
    <section id="topo" className="relative overflow-hidden border-b border-white/[0.08]">
      {/* Background Photo with Measured Obsidian Scrim */}
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Vista panorâmica da cidade do Lubango e Serra da Leba na Província da Huíla"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090B]/75 via-[#09090B]/85 to-[#09090B]" />
      </div>

      <div className="relative mx-auto max-w-[1360px] px-5 pt-12 pb-10 md:px-8 md:pt-16 md:pb-14">
        <div className="max-w-3xl">
          <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
            Província da Huíla · Lubango e os 14 Municípios
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-[#F5F2EB] sm:text-5xl [text-wrap:balance]">
            O mercado digital de serviços da Huíla, num único lugar.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#D6D3D1]">
            Encontre empresas privadas verificadas e profissionais independentes ao domicílio ou por
            deslocação em toda a província — do comércio e restauração à construção, saúde e
            tecnologia.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onOpenRegister}
              className="inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158] transition-colors whitespace-nowrap"
            >
              Cadastrar Empresa ou Profissional
            </button>
            <a
              href="#explorar"
              className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-[#121216]/80 px-5 py-3 text-sm font-medium text-[#F5F2EB] hover:border-[#D4AF37]/60 transition-colors whitespace-nowrap"
            >
              {activeCount > 0 ? `Explorar ${activeCount} serviços ativos` : 'Explorar Diretório'}
            </a>
          </div>
        </div>

        {/* Unified Real-Time Search & Filter Bar */}
        <div
          aria-label="Barra de pesquisa e filtros em tempo real"
          className="mt-10 rounded-xl border border-[#D4AF37]/25 bg-[#121216]/95 p-4 backdrop-blur-md md:p-5"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <label htmlFor="search-input" className="sr-only">
                Pesquisar por nome, serviço ou especialidade
              </label>
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#A8A29E]" />
                <input
                  id="search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Pesquisar empresa ou serviço..."
                  className="w-full rounded-lg border border-white/10 bg-[#09090B] py-2.5 pl-10 pr-3 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="municipality-filter" className="sr-only">
                Filtrar por município da Huíla
              </label>
              <select
                id="municipality-filter"
                value={selectedMunicipality}
                onChange={(e) => onMunicipalityChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              >
                <option value="all">Todos os municípios da Huíla</option>
                {HUILA_MUNICIPALITIES.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="category-filter" className="sr-only">
                Filtrar por categoria
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value as CategoryId | 'all')}
                className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              >
                <option value="all">Todas as 8 categorias</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="entity-filter" className="sr-only">
                Filtrar por tipo de prestador
              </label>
              <select
                id="entity-filter"
                value={selectedEntityType}
                onChange={(e) => onEntityTypeChange(e.target.value as EntityType | 'all')}
                className="w-full rounded-lg border border-white/10 bg-[#09090B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              >
                <option value="all">Todos os prestadores</option>
                <option value="company">Apenas Empresas</option>
                <option value="independent">Profissionais Independentes</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#A8A29E]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>
                Diretório exclusivo privado da Huíla — serviços governamentais não são cadastrados.
              </span>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="font-medium text-[#D4AF37] hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
