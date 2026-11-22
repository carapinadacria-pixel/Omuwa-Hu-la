import { Check } from 'lucide-react';
import { PlanTier } from '../types/marketplace';

interface PlansSectionProps {
  onSelectPlan: (plan: PlanTier) => void;
}

export function PlansSection({ onSelectPlan }: PlansSectionProps) {
  return (
    <section id="planos" className="border-b border-white/[0.08] py-12 md:py-16">
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
            Planos de Cadastramento
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl [text-wrap:balance]">
            Escolha como apresentar o seu negócio na Huíla
          </h2>
          <p className="mt-2 text-sm text-[#A8A29E]">
            Tanto empresas estabelecidas como profissionais individuais ao domicílio podem começar
            gratuitamente ou ativar o destaque patrocinado no painel principal.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Plano Normal */}
          <div className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#121216] p-6 md:p-8">
            <div>
              <div className="text-xs font-medium text-[#A8A29E]">
                Para empresas e trabalhadores independentes em início
              </div>
              <h3 className="mt-1.5 font-display text-2xl font-semibold text-[#F5F2EB]">
                Plano Normal
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono-tabular text-3xl font-semibold text-[#F5F2EB]">
                  0 Kz
                </span>
                <span className="text-xs text-[#A8A29E]">/ cadastro permanente</span>
              </div>

              <ul className="mt-6 space-y-3 border-t border-white/[0.08] pt-6 text-sm text-[#D6D3D1]">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#A8A29E]" />
                  <span>Presença completa no diretório oficial da Província da Huíla</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#A8A29E]" />
                  <span>Botões diretos de Chamada Telefónica e WhatsApp no cartão</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#A8A29E]" />
                  <span>Indexação em pesquisas por município, categoria e serviço ao domicílio</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#A8A29E]" />
                  <span>Exibição na secção Recém-Cadastrados após validação geográfica</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('normal')}
              className="mt-8 w-full rounded-lg border border-white/20 bg-[#18181D] px-5 py-3 text-sm font-semibold text-[#F5F2EB] hover:border-[#D4AF37]/60 transition-colors min-h-[44px]"
            >
              Cadastrar com Plano Normal
            </button>
          </div>

          {/* Plano Premium */}
          <div className="flex flex-col justify-between rounded-xl border border-[#D4AF37]/50 bg-[#141310] p-6 md:p-8">
            <div>
              <div className="text-xs font-semibold text-[#D4AF37]">
                Para visibilidade máxima e captação prioritária
              </div>
              <h3 className="mt-1.5 font-display text-2xl font-semibold text-[#F5F2EB]">
                Plano Premium
              </h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono-tabular text-3xl font-semibold text-[#D4AF37]">
                  15.000 Kz
                </span>
                <span className="text-xs text-[#A8A29E]">/ mês (30 dias em destaque)</span>
              </div>

              <ul className="mt-6 space-y-3 border-t border-[#D4AF37]/20 pt-6 text-sm text-[#F5F2EB]">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                  <span>Presença fixa no Dashboard de Empresas &amp; Serviços em Destaque</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                  <span>Selo transparente &ldquo;Destaque Patrocinado&rdquo; e prioridade nas pesquisas</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                  <span>Elegibilidade para publicação no bloco de Novidades em Destaque</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />
                  <span>Métricas de visualizações, cliques no WhatsApp e chamadas telefónicas</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectPlan('premium')}
              className="mt-8 w-full rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158] transition-colors min-h-[44px]"
            >
              Ativar Plano Premium em Destaque
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
