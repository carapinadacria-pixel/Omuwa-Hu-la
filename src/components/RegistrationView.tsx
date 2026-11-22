import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { CATEGORIES, HUILA_MUNICIPALITIES } from '../data/huilaCatalog';
import {
  CategoryId,
  EntityType,
  ListingStatus,
  PlanTier,
  ServiceListing,
  ServiceMode,
} from '../types/marketplace';

interface RegistrationViewProps {
  initialPlan?: PlanTier;
  onCancel: () => void;
  onSuccess: (listing: ServiceListing, status: ListingStatus, message: string) => void;
}

interface SubmissionFeedback {
  type: 'approved' | 'pending_review' | 'rejected' | 'error';
  title: string;
  message: string;
}

export function RegistrationView({
  initialPlan = 'normal',
  onCancel,
  onSuccess,
}: RegistrationViewProps) {
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>('company');
  const [category, setCategory] = useState<CategoryId>('comercio');
  const [subcategory, setSubcategory] = useState(CATEGORIES[0].subcategories[0]);
  const [municipality, setMunicipality] = useState<string>('Lubango');
  const [localityHint, setLocalityHint] = useState('');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('estabelecimento');
  const [description, setDescription] = useState('');
  const [requirementValue, setRequirementValue] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [planTier, setPlanTier] = useState<PlanTier>(initialPlan);
  const [declaredNotGovernment, setDeclaredNotGovernment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<SubmissionFeedback | null>(null);

  const selectedCategoryMeta =
    CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const handleCategoryChange = (newCat: CategoryId) => {
    setCategory(newCat);
    const meta = CATEGORIES.find((c) => c.id === newCat);
    if (meta && meta.subcategories.length > 0) {
      setSubcategory(meta.subcategories[0]);
    }
    if (newCat === 'trabalhadores_independentes') {
      setEntityType('independent');
      setServiceMode('domicilio');
    }
  };

  const handleEntityTypeChange = (type: EntityType) => {
    setEntityType(type);
    if (type === 'independent' && serviceMode === 'estabelecimento') {
      setServiceMode('domicilio');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!declaredNotGovernment) {
      setFeedback({
        type: 'rejected',
        title: 'Declaração obrigatória',
        message:
          'Confirme que a empresa ou profissional não pertence ao governo. Serviços estatais não são permitidos no Omuwa-Huíla.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/listings/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          entityType,
          category,
          subcategory,
          municipality,
          localityHint: localityHint.trim() || undefined,
          serviceMode,
          coverageAreas: [municipality],
          description,
          requirementValue,
          phone,
          whatsapp: whatsapp || phone,
          planTier,
          declaredNotGovernment,
        }),
      });

      const data = (await response.json()) as {
        listing?: ServiceListing;
        status?: ListingStatus;
        message?: string;
        error?: string;
        quotaExceeded?: boolean;
      };

      if (data.quotaExceeded) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }

      if (!response.ok) {
        setFeedback({
          type: response.status === 422 ? 'rejected' : 'error',
          title:
            response.status === 422
              ? 'Cadastro bloqueado pela validação'
              : 'Verifique os dados preenchidos',
          message: data.message || data.error || 'Não foi possível concluir o cadastro.',
        });
        return;
      }

      if (data.listing && data.status) {
        if (data.status === 'approved') {
          setFeedback({
            type: 'approved',
            title: 'Aprovação Automática — Publicado no Diretório!',
            message:
              data.message ||
              'Localização confirmada na Província da Huíla. O serviço já está ativo no marketplace.',
          });
        } else {
          setFeedback({
            type: 'pending_review',
            title: 'Encaminhado para Análise Administrativa',
            message:
              data.message ||
              'A localização precisa de verificação manual no Painel Admin antes da publicação.',
          });
        }
        onSuccess(data.listing, data.status, data.message || '');
      }
    } catch {
      setFeedback({
        type: 'error',
        title: 'Erro de comunicação',
        message: 'Não foi possível contactar o servidor de validação. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#A8A29E] hover:text-[#D4AF37]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Diretório
        </button>

        <div className="mt-4 border-b border-white/[0.08] pb-6">
          <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
            Cadastro Exclusivo Província da Huíla
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#F5F2EB]">
            Registar Empresa ou Profissional Independente
          </h1>
          <p className="mt-2 text-sm text-[#A8A29E]">
            Formulário simplificado: não exigimos coordenadas GPS nem morada detalhada nesta etapa —
            basta selecionar o seu município oficial da Huíla. Serviços governamentais não são
            aceites.
          </p>
        </div>

        {/* Submission Feedback */}
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-6 rounded-xl border p-5 ${
              feedback.type === 'approved'
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-100'
                : feedback.type === 'pending_review'
                  ? 'border-[#D4AF37]/50 bg-[#1B1810] text-[#F5E6B3]'
                  : 'border-red-500/40 bg-red-950/30 text-red-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {feedback.type === 'approved' && (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              )}
              {feedback.type === 'pending_review' && (
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
              )}
              {(feedback.type === 'rejected' || feedback.type === 'error') && (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              )}
              <div>
                <h2 className="text-sm font-semibold">{feedback.title}</h2>
                <p className="mt-1 text-sm opacity-90">{feedback.message}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-7">
          {/* 1. Plan Selection */}
          <div>
            <span className="block text-sm font-semibold text-[#F5F2EB]">
              1. Selecione o Plano de Cadastramento
            </span>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPlanTier('normal')}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  planTier === 'normal'
                    ? 'border-[#D4AF37] bg-[#161511]'
                    : 'border-white/10 bg-[#121216] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#F5F2EB]">Plano Normal</span>
                  <span className="font-mono-tabular text-sm font-semibold text-[#D6D3D1]">
                    0 Kz
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#A8A29E]">
                  Listagem padrão no diretório da Huíla com botões Ligar e WhatsApp.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPlanTier('premium')}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  planTier === 'premium'
                    ? 'border-[#D4AF37] bg-[#1A170E]'
                    : 'border-white/10 bg-[#121216] hover:border-white/25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#D4AF37]">
                    Plano Premium · Destaque
                  </span>
                  <span className="font-mono-tabular text-sm font-semibold text-[#D4AF37]">
                    15.000 Kz/mês
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[#D6D3D1]">
                  Posição prioritária no Dashboard em Destaque e selo Destaque Patrocinado.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Entity Type & Service Mode */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <span className="block text-sm font-semibold text-[#F5F2EB]">
                2. Tipo de Prestador
              </span>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleEntityTypeChange('company')}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors min-h-[44px] ${
                    entityType === 'company'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'border-white/10 bg-[#121216] text-[#A8A29E]'
                  }`}
                >
                  Empresa Privada
                </button>
                <button
                  type="button"
                  onClick={() => handleEntityTypeChange('independent')}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors min-h-[44px] ${
                    entityType === 'independent'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]'
                      : 'border-white/10 bg-[#121216] text-[#A8A29E]'
                  }`}
                >
                  Profissional Independente
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-service-mode"
                className="block text-sm font-semibold text-[#F5F2EB]"
              >
                Modalidade de Atendimento
              </label>
              <select
                id="reg-service-mode"
                value={serviceMode}
                onChange={(e) => setServiceMode(e.target.value as ServiceMode)}
                className="mt-2.5 w-full rounded-lg border border-white/10 bg-[#121216] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              >
                <option value="estabelecimento">Atendimento em estabelecimento local</option>
                <option value="domicilio">Trabalho ao domicílio</option>
                <option value="deslocacao">Por deslocação até ao cliente</option>
                <option value="hibrido">Estabelecimento + Deslocação ao domicílio</option>
              </select>
            </div>
          </div>

          {/* 3. Business / Professional Identity */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="reg-name" className="block text-sm font-semibold text-[#F5F2EB]">
                Nome Comercial ou Nome do Profissional *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Studio Solar Lubango ou Carlos Mendes — Canalização"
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#121216] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="reg-category" className="block text-sm font-semibold text-[#F5F2EB]">
                Categoria Principal *
              </label>
              <select
                id="reg-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as CategoryId)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#121216] px-3.5 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="reg-subcategory"
                className="block text-sm font-semibold text-[#F5F2EB]"
              >
                Subcategoria / Especialidade
              </label>
              <select
                id="reg-subcategory"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#121216] px-3.5 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              >
                {selectedCategoryMeta.subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Simplified Huíla Geographic Validation */}
          <div className="grid grid-cols-1 gap-5 rounded-xl border border-white/[0.08] bg-[#121216] p-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reg-municipality"
                className="block text-sm font-semibold text-[#F5F2EB]"
              >
                Município na Província da Huíla *
              </label>
              <select
                id="reg-municipality"
                required
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              >
                {HUILA_MUNICIPALITIES.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-[#A8A29E]">
                Apenas os 14 municípios oficiais da Huíla são aceites.
              </p>
            </div>

            <div>
              <label htmlFor="reg-locality" className="block text-sm font-semibold text-[#F5F2EB]">
                Referência de Zona / Cidade (Opcional)
              </label>
              <input
                id="reg-locality"
                type="text"
                value={localityHint}
                onChange={(e) => setLocalityHint(e.target.value)}
                placeholder="Ex: Centro do Lubango (opcional, sem morada exata)"
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              />
              <p className="mt-1.5 text-xs text-[#A8A29E]">
                Validado no servidor via Google Maps Geocoding API.
              </p>
            </div>
          </div>

          {/* 5. Category Profile Requirement & Description */}
          <div className="space-y-5">
            <div>
              <label htmlFor="reg-req" className="block text-sm font-semibold text-[#F5F2EB]">
                {selectedCategoryMeta.profileRequirementLabel}
              </label>
              <input
                id="reg-req"
                type="text"
                value={requirementValue}
                onChange={(e) => setRequirementValue(e.target.value)}
                placeholder={selectedCategoryMeta.profileRequirementPlaceholder}
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#121216] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="reg-desc" className="block text-sm font-semibold text-[#F5F2EB]">
                Descrição dos Serviços Prestados *
              </label>
              <textarea
                id="reg-desc"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva os serviços, horários ou zonas onde se desloca na Província da Huíla..."
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#121216] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* 6. Direct Contacts */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-semibold text-[#F5F2EB]">
                Telefone para Chamadas *
              </label>
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+244 923 000 000"
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#121216] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="reg-whatsapp"
                className="block text-sm font-semibold text-[#F5F2EB]"
              >
                Número de WhatsApp
              </label>
              <input
                id="reg-whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="923 000 000 (mesmo se igual)"
                className="mt-2 w-full rounded-lg border border-white/10 bg-[#121216] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* 7. Non-Government Declaration */}
          <div className="rounded-xl border border-[#D4AF37]/25 bg-[#141310] p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={declaredNotGovernment}
                onChange={(e) => setDeclaredNotGovernment(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/30 bg-[#09090B] accent-[#D4AF37]"
              />
              <span className="text-xs leading-relaxed text-[#E7E5E4]">
                <strong className="text-[#D4AF37]">Política Omuwa-Huíla:</strong> Declaro que esta
                empresa ou atividade independente é estritamente privada e{' '}
                <strong>não representa um serviço prestado pelo governo</strong>, estando sediada
                ou atuando na Província da Huíla.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.08] pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-[#D6D3D1] hover:border-white/30 min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158] disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'A validar localização na Huíla...' : 'Submeter Cadastro'}
            </button>
          </div>

          <p className="flex items-center gap-2 text-xs text-[#78716C]">
            <AlertTriangle className="h-3.5 w-3.5 text-[#D4AF37]" />
            Registos com localização fora da Huíla são bloqueados automaticamente; referências
            imprecisas entram na fila de análise administrativa.
          </p>
        </form>
      </div>
    </section>
  );
}
