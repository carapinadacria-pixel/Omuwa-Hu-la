import { CheckCircle2, MapPin, MessageSquarePlus, ShieldCheck, Star, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { HUILA_MUNICIPALITIES } from '../data/huilaCatalog';
import { AuthUser, TestimonialAuthorRole, UserTestimonial } from '../types/marketplace';
import { computeTestimonialStats } from '../utils/testimonials';

interface TestimonialsSectionProps {
  testimonials: UserTestimonial[];
  currentUser: AuthUser | null;
  onTestimonialAdded: (item: UserTestimonial) => void;
}

const AUTHOR_ROLES: TestimonialAuthorRole[] = [
  'Cliente',
  'Empresa Parceira',
  'Profissional Independente',
];

export function TestimonialsSection({
  testimonials,
  currentUser,
  onTestimonialAdded,
}: TestimonialsSectionProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [authorName, setAuthorName] = useState(currentUser?.name || '');
  const [authorRole, setAuthorRole] = useState<TestimonialAuthorRole>('Cliente');
  const [municipality, setMunicipality] = useState<string>(HUILA_MUNICIPALITIES[0]);
  const [rating, setRating] = useState<number>(5);
  const [serviceContext, setServiceContext] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.name && !authorName) {
      setAuthorName(currentUser.name);
    }
  }, [currentUser?.name, authorName]);

  const publishedTestimonials = testimonials.filter((t) => t.isPublished);
  const stats = computeTestimonialStats(testimonials);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName,
          authorRole,
          municipality,
          rating,
          serviceContext,
          comment,
        }),
      });

      const data = (await res.json()) as {
        testimonial?: UserTestimonial;
        error?: string;
      };

      if (!res.ok || !data.testimonial) {
        setError(data.error || 'Não foi possível registar o seu depoimento.');
        return;
      }

      onTestimonialAdded(data.testimonial);
      setServiceContext('');
      setComment('');
      setRating(5);
      setIsComposerOpen(false);
      setSuccessMessage('Obrigado! O seu depoimento foi publicado no marketplace Omuwa-Huíla.');
    } catch {
      setError('Erro de ligação com o servidor. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="depoimentos"
      aria-labelledby="heading-depoimentos"
      className="border-b border-white/[0.08] py-12 md:py-16"
    >
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        {/* Section Header + Real Stats Strip */}
        <div className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
              Confiança &amp; Transparência na Huíla
            </p>
            <h2
              id="heading-depoimentos"
              className="mt-2 font-display text-2xl font-semibold text-[#F5F2EB] sm:text-3xl [text-wrap:balance]"
            >
              Depoimentos de Usuários
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#A8A29E]">
              Experiências partilhadas por clientes, empresas privadas e profissionais independentes
              que utilizam o Omuwa-Huíla nos 14 municípios da província.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <div className="font-mono-tabular text-xl font-semibold text-[#F5F2EB]">
                {stats.count > 0 ? `${stats.averageRating.toFixed(1)}/5` : '—'}
              </div>
              <div className="text-xs text-[#A8A29E]">Classificação média</div>
            </div>
            <div className="h-8 w-px bg-white/10" aria-hidden="true" />
            <div>
              <div className="font-mono-tabular text-xl font-semibold text-[#F5F2EB]">
                {stats.count}
              </div>
              <div className="text-xs text-[#A8A29E]">
                {stats.count === 1 ? 'Depoimento publicado' : 'Depoimentos publicados'}
              </div>
            </div>
            <div className="hidden h-8 w-px bg-white/10 sm:block" aria-hidden="true" />
            <button
              type="button"
              onClick={() => {
                setIsComposerOpen((prev) => !prev);
                setError(null);
              }}
              aria-expanded={isComposerOpen}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#09090B] transition-colors whitespace-nowrap min-h-[40px]"
            >
              {isComposerOpen ? (
                <>
                  <X className="h-3.5 w-3.5" />
                  Fechar formulário
                </>
              ) : (
                <>
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  Deixar Depoimento
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Feedback */}
        {successMessage && (
          <div
            role="status"
            className="mt-6 flex items-center gap-2.5 rounded-xl border border-[#D4AF37]/40 bg-[#1B1810] px-4 py-3 text-xs text-[#F5E6B3]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#D4AF37]" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Inline Testimonial Composer */}
        {isComposerOpen && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-xl border border-[#D4AF37]/30 bg-[#121216] p-6 space-y-5"
          >
            <div className="flex flex-col justify-between gap-2 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-semibold text-[#F5F2EB]">
                  Partilhar a sua experiência no Omuwa-Huíla
                </h3>
                <p className="mt-0.5 text-xs text-[#A8A29E]">
                  Avalie o contacto com empresas ou trabalhadores independentes da Província da
                  Huíla.
                </p>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-950/30 px-3.5 py-2.5 text-xs text-red-200"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label
                  htmlFor="testimonial-author"
                  className="block text-xs font-semibold text-[#F5F2EB]"
                >
                  Seu Nome *
                </label>
                <input
                  id="testimonial-author"
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex: Mariana Tchissola"
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="testimonial-role"
                  className="block text-xs font-semibold text-[#F5F2EB]"
                >
                  Perfil na Plataforma *
                </label>
                <select
                  id="testimonial-role"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value as TestimonialAuthorRole)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
                >
                  {AUTHOR_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="testimonial-municipality"
                  className="block text-xs font-semibold text-[#F5F2EB]"
                >
                  Município da Huíla *
                </label>
                <select
                  id="testimonial-municipality"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3 py-2.5 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
                >
                  {HUILA_MUNICIPALITIES.map((mun) => (
                    <option key={mun} value={mun}>
                      {mun}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#F5F2EB]">
                  Classificação *
                </span>
                <div
                  role="radiogroup"
                  aria-label="Classificação em estrelas"
                  className="mt-1.5 flex items-center gap-1.5 min-h-[44px]"
                >
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const active = starValue <= rating;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        role="radio"
                        aria-checked={rating === starValue}
                        aria-label={`${starValue} ${starValue === 1 ? 'estrela' : 'estrelas'}`}
                        onClick={() => setRating(starValue)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#09090B] hover:border-[#D4AF37]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            active
                              ? 'fill-[#D4AF37] text-[#D4AF37]'
                              : 'text-[#78716C]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <label
                  htmlFor="testimonial-context"
                  className="block text-xs font-semibold text-[#F5F2EB]"
                >
                  Serviço Utilizado (Opcional)
                </label>
                <input
                  id="testimonial-context"
                  type="text"
                  value={serviceContext}
                  onChange={(e) => setServiceContext(e.target.value)}
                  placeholder="Ex: Canalização ao domicílio no Lubango"
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="md:col-span-8">
                <label
                  htmlFor="testimonial-comment"
                  className="block text-xs font-semibold text-[#F5F2EB]"
                >
                  O seu Depoimento *
                </label>
                <textarea
                  id="testimonial-comment"
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como foi contratar ou divulgar serviços através do Omuwa-Huíla..."
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3.5 py-2.5 text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-[#D6D3D1] hover:border-white/30 min-h-[42px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#D4AF37] px-5 py-2.5 text-xs font-semibold text-[#09090B] hover:bg-[#E5C158] disabled:opacity-50 min-h-[42px]"
              >
                {isSubmitting ? 'A publicar...' : 'Publicar Depoimento'}
              </button>
            </div>
          </form>
        )}

        {/* Published Testimonials Grid or Trust-Oriented Empty State */}
        {publishedTestimonials.length > 0 ? (
          <div
            data-testid="testimonials-grid"
            className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {publishedTestimonials.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#121216] p-6"
              >
                <div>
                  <div
                    className="flex items-center gap-1"
                    aria-label={`Classificação ${item.rating} de 5 estrelas`}
                  >
                    {[1, 2, 3, 4, 5].map((starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-4 w-4 ${
                          starIndex <= item.rating
                            ? 'fill-[#D4AF37] text-[#D4AF37]'
                            : 'text-[#3F3F46]'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[#E7E5E4]">
                    “{item.comment}”
                  </p>
                </div>

                <div className="mt-6 border-t border-white/[0.06] pt-4">
                  <div className="text-sm font-semibold text-[#F5F2EB]">{item.authorName}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[#A8A29E]">
                    <span className="text-[#D4AF37] font-medium">{item.authorRole}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.municipality}</span>
                  </div>
                  {item.serviceContext && (
                    <div className="mt-1 text-xs text-[#78716C]">{item.serviceContext}</div>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-white/[0.08] bg-[#121216] p-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <h3 className="text-base font-semibold text-[#F5F2EB]">
                  Ainda não existem depoimentos publicados
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#A8A29E]">
                  Aqui exibimos exclusivamente avaliações reais enviadas por clientes e prestadores
                  da Província da Huíla — sem avaliações simuladas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-3 text-xs font-semibold text-[#09090B] hover:bg-[#E5C158] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Partilhar o Primeiro Depoimento
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/[0.08] pt-6 md:grid-cols-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>Validação na Província da Huíla</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#A8A29E]">
                  Cada cadastro passa por verificação geográfica para confirmar atuação em Lubango e
                  nos 14 municípios da Huíla.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Setor Privado &amp; Independentes</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#A8A29E]">
                  Diretório dedicado exclusivamente a empresas privadas e trabalhadores por conta
                  própria, ao domicílio ou por deslocação.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Contacto Direto Sem Intermediários</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#A8A29E]">
                  Negocie diretamente por chamada telefónica ou WhatsApp com o prestador escolhido,
                  com total transparência.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
