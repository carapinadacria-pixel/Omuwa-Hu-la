import { Check, Pause, Plus, ShieldCheck, Star, Trash2, UserCheck, UserMinus, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { CATEGORIES, HUILA_MUNICIPALITIES } from '../data/huilaCatalog';
import {
  AdminMetrics,
  AuthUser,
  CategoryId,
  FeaturedNewsItem,
  ListingStatus,
  PaymentStatus,
  PlanTier,
  ServiceListing,
  UserRole,
  UserTestimonial,
} from '../types/marketplace';
import { canManageGestorRoles } from '../utils/authRules';

interface AdminPanelProps {
  currentUser: AuthUser;
  onBackToSite: () => void;
  onDataMutated: () => void;
}

type AdminTab = 'moderation' | 'ads' | 'news' | 'testimonials' | 'team';

export function AdminPanel({ currentUser, onBackToSite, onDataMutated }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('moderation');
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [news, setNews] = useState<FeaturedNewsItem[]>([]);
  const [testimonials, setTestimonials] = useState<UserTestimonial[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFeedback, setRoleFeedback] = useState<string | null>(null);

  // News composer state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsCategory, setNewsCategory] = useState<CategoryId>('comercio');
  const [newsMunicipality, setNewsMunicipality] = useState<string>('Lubango');
  const [newsTag, setNewsTag] = useState('Novidade em Destaque');
  const [relatedListingId, setRelatedListingId] = useState('');

  const isRootAdmin = canManageGestorRoles(currentUser.role);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      if (!res.ok) return;
      const data = (await res.json()) as {
        listings: ServiceListing[];
        news: FeaturedNewsItem[];
        testimonials?: UserTestimonial[];
        users: AuthUser[];
        metrics: AdminMetrics;
      };
      setListings(data.listings);
      setNews(data.news);
      setTestimonials(data.testimonials || []);
      setUsers(data.users || []);
      setMetrics(data.metrics);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const updateListing = async (
    id: string,
    payload: Partial<{
      status: ListingStatus;
      planTier: PlanTier;
      paymentStatus: PaymentStatus;
      adOrder: number;
      adDurationDays: number;
      isRecommended: boolean;
      adminNote: string;
    }>
  ) => {
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchOverview();
      onDataMutated();
    }
  };

  const handlePublishNews = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsSummary.trim()) return;
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newsTitle,
        summary: newsSummary,
        category: newsCategory,
        municipality: newsMunicipality,
        tag: newsTag,
        relatedListingId: relatedListingId || undefined,
      }),
    });
    if (res.ok) {
      setNewsTitle('');
      setNewsSummary('');
      setRelatedListingId('');
      await fetchOverview();
      onDataMutated();
    }
  };

  const toggleNewsHighlight = async (item: FeaturedNewsItem) => {
    const res = await fetch(`/api/admin/news/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHighlighted: !item.isHighlighted }),
    });
    if (res.ok) {
      await fetchOverview();
      onDataMutated();
    }
  };

  const toggleTestimonialVisibility = async (item: UserTestimonial) => {
    const res = await fetch(`/api/admin/testimonials/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !item.isPublished }),
    });
    if (res.ok) {
      await fetchOverview();
      onDataMutated();
    }
  };

  const deleteTestimonial = async (id: string) => {
    const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchOverview();
      onDataMutated();
    }
  };

  const handleChangeUserRole = async (targetUser: AuthUser, newRole: UserRole) => {
    setRoleFeedback(null);
    const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setRoleFeedback(data.error || 'Não foi possível atualizar o cargo.');
      return;
    }
    setRoleFeedback(
      newRole === 'gestor'
        ? `${targetUser.name} foi nomeado Gestor e agora pode visualizar e usar o Painel Administrativo.`
        : `O acesso de Gestor de ${targetUser.name} foi removido.`
    );
    await fetchOverview();
  };

  const pendingQueue = listings.filter((l) => l.status === 'pending_review');

  return (
    <section className="py-10 md:py-12">
      <div className="mx-auto max-w-[1360px] px-5 md:px-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
              Administração, Moderação &amp; Segurança · Perfil:{' '}
              {currentUser.role === 'admin' ? 'Administrador' : 'Gestor'}
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-semibold text-[#F5F2EB]">
              Painel Administrativo Omuwa-Huíla
            </h1>
          </div>
          <button
            type="button"
            onClick={onBackToSite}
            className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-[#F5F2EB] hover:border-[#D4AF37] whitespace-nowrap min-h-[40px]"
          >
            Ver Diretório Público
          </button>
        </div>

        {/* Internal Metrics Strip */}
        {metrics && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-5">
              <div className="text-xs text-[#A8A29E]">Empresas &amp; Profissionais Ativos</div>
              <div className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F5F2EB]">
                {metrics.totalActiveListings}
              </div>
              <div className="mt-1 text-xs text-[#78716C]">
                {metrics.totalCompanies} empresas · {metrics.totalIndependents} independentes
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-5">
              <div className="text-xs text-[#A8A29E]">Cliques de Contacto &amp; Pesquisas</div>
              <div className="mt-2 font-mono-tabular text-2xl font-semibold text-[#D4AF37]">
                {metrics.totalWhatsappClicks + metrics.totalCallClicks}
              </div>
              <div className="mt-1 font-mono-tabular text-xs text-[#78716C]">
                {metrics.totalWhatsappClicks} WhatsApp · {metrics.totalCallClicks} chamadas ·{' '}
                {metrics.totalSearches} pesquisas
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-5">
              <div className="text-xs text-[#A8A29E]">Fila de Revisão Geográfica</div>
              <div className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F5F2EB]">
                {metrics.pendingReviewCount}
              </div>
              <div className="mt-1 text-xs text-[#78716C]">
                {metrics.premiumActiveCount} destaques Premium ativos
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-5">
              <div className="text-xs text-[#A8A29E]">Quota &amp; Cache Geocoding API</div>
              <div className="mt-2 font-mono-tabular text-2xl font-semibold text-[#F5F2EB]">
                {metrics.geocodingDailyCount}/{metrics.geocodingDailyLimit}
              </div>
              <div className="mt-1 font-mono-tabular text-xs text-[#78716C]">
                {metrics.geocodingCacheEntries} entradas em cache · {metrics.geocodingCacheHits}{' '}
                reutilizações
              </div>
            </div>
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Ferramentas de administração"
          className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4"
        >
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'moderation'}
            onClick={() => setActiveTab('moderation')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activeTab === 'moderation'
                ? 'bg-[#D4AF37] text-[#09090B]'
                : 'border border-white/10 bg-[#121216] text-[#A8A29E] hover:text-[#F5F2EB]'
            }`}
          >
            Fila de Aprovação &amp; Revisão ({pendingQueue.length})
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'ads'}
            onClick={() => setActiveTab('ads')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activeTab === 'ads'
                ? 'bg-[#D4AF37] text-[#09090B]'
                : 'border border-white/10 bg-[#121216] text-[#A8A29E] hover:text-[#F5F2EB]'
            }`}
          >
            Gestão de Anúncios Premium
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'news'}
            onClick={() => setActiveTab('news')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activeTab === 'news'
                ? 'bg-[#D4AF37] text-[#09090B]'
                : 'border border-white/10 bg-[#121216] text-[#A8A29E] hover:text-[#F5F2EB]'
            }`}
          >
            Novidades em Destaque ({news.length})
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'testimonials'}
            onClick={() => setActiveTab('testimonials')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activeTab === 'testimonials'
                ? 'bg-[#D4AF37] text-[#09090B]'
                : 'border border-white/10 bg-[#121216] text-[#A8A29E] hover:text-[#F5F2EB]'
            }`}
          >
            Depoimentos ({testimonials.length})
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'team'}
            onClick={() => setActiveTab('team')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap min-h-[40px] ${
              activeTab === 'team'
                ? 'bg-[#D4AF37] text-[#09090B]'
                : 'border border-white/10 bg-[#121216] text-[#A8A29E] hover:text-[#F5F2EB]'
            }`}
          >
            Equipa &amp; Gestores ({users.length})
          </button>
        </div>

        {/* Tab 1: Moderation & Geographic Review Queue */}
        {activeTab === 'moderation' && (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F2EB]">
                Revisão Geográfica Pendente ({pendingQueue.length})
              </h2>
              <p className="mt-1 text-xs text-[#A8A29E]">
                Empresas ou profissionais com endereço impreciso ou sem confirmação automática do
                Google Maps aguardam aprovação manual antes de ir ao ar.
              </p>
            </div>

            {isLoading ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-8 text-sm text-[#A8A29E]">
                A carregar fila de moderação...
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-8 text-center text-sm text-[#A8A29E]">
                Ainda não existem cadastros submetidos na plataforma.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#121216]">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-xs text-[#A8A29E]">
                      <th className="px-4 py-3 font-medium">Prestador</th>
                      <th className="px-4 py-3 font-medium">Município</th>
                      <th className="px-4 py-3 font-medium">Validação Geográfica</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {listings.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-[#F5F2EB]">{item.name}</div>
                          <div className="text-xs text-[#78716C]">
                            {item.entityType === 'independent'
                              ? 'Profissional Independente'
                              : 'Empresa Privada'}{' '}
                            · {item.planTier === 'premium' ? 'Premium' : 'Normal'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#D6D3D1]">
                          <div>{item.municipality}</div>
                          {item.localityHint && (
                            <div className="text-[#78716C]">{item.localityHint}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#A8A29E] max-w-xs">
                          {item.geoVerification.reason}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold">
                          {item.status === 'approved' && (
                            <span className="text-emerald-400">Aprovado</span>
                          )}
                          {item.status === 'pending_review' && (
                            <span className="text-[#D4AF37]">Em Análise</span>
                          )}
                          {item.status === 'suspended' && (
                            <span className="text-amber-400">Suspenso</span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="text-red-400">Rejeitado</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {item.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => updateListing(item.id, { status: 'approved' })}
                                aria-label={`Aprovar ${item.name}`}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600/20 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Aprovar
                              </button>
                            )}
                            {item.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => updateListing(item.id, { status: 'suspended' })}
                                aria-label={`Suspender ${item.name}`}
                                className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-[#D6D3D1] hover:border-amber-400/50 hover:text-amber-300"
                              >
                                <Pause className="h-3.5 w-3.5" />
                                Suspender
                              </button>
                            )}
                            {item.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => updateListing(item.id, { status: 'rejected' })}
                                aria-label={`Rejeitar ${item.name}`}
                                className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-[#A8A29E] hover:border-red-500/50 hover:text-red-300"
                              >
                                <X className="h-3.5 w-3.5" />
                                Rejeitar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Ad & Premium Highlights Management */}
        {activeTab === 'ads' && (
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F2EB]">
                Controlo de Ordem, Duração e Pagamentos de Destaques
              </h2>
              <p className="mt-1 text-xs text-[#A8A29E]">
                Gerencie quais empresas aparecem no Dashboard em Destaque, a sua ordem prioritária e
                o estado de pagamento do Plano Premium.
              </p>
            </div>

            {listings.filter((l) => l.status === 'approved').length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-8 text-center text-sm text-[#A8A29E]">
                Ainda não existem prestadores aprovados para gerir destaques.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#121216]">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-xs text-[#A8A29E]">
                      <th className="px-4 py-3 font-medium">Empresa / Profissional</th>
                      <th className="px-4 py-3 font-medium">Plano</th>
                      <th className="px-4 py-3 font-medium">Ordem</th>
                      <th className="px-4 py-3 font-medium">Duração (dias)</th>
                      <th className="px-4 py-3 font-medium">Pagamento</th>
                      <th className="px-4 py-3 font-medium text-right">Cliques (WA/Tel)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {listings
                      .filter((l) => l.status === 'approved')
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#F5F2EB]">{item.name}</div>
                            <div className="text-xs text-[#78716C]">{item.municipality}</div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Plano de ${item.name}`}
                              value={item.planTier}
                              onChange={(e) =>
                                updateListing(item.id, { planTier: e.target.value as PlanTier })
                              }
                              className="rounded-md border border-white/15 bg-[#09090B] px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                            >
                              <option value="normal">Normal</option>
                              <option value="premium">Premium (Destaque)</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={1}
                              max={99}
                              aria-label={`Ordem de destaque de ${item.name}`}
                              value={item.adOrder}
                              onChange={(e) =>
                                updateListing(item.id, { adOrder: Number(e.target.value) || 1 })
                              }
                              className="w-16 rounded-md border border-white/15 bg-[#09090B] px-2 py-1.5 font-mono-tabular text-xs text-[#F5F2EB]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              max={365}
                              aria-label={`Duração em dias de ${item.name}`}
                              value={item.adDurationDays}
                              onChange={(e) =>
                                updateListing(item.id, {
                                  adDurationDays: Number(e.target.value) || 0,
                                })
                              }
                              className="w-20 rounded-md border border-white/15 bg-[#09090B] px-2 py-1.5 font-mono-tabular text-xs text-[#F5F2EB]"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Estado de pagamento de ${item.name}`}
                              value={item.paymentStatus}
                              onChange={(e) =>
                                updateListing(item.id, {
                                  paymentStatus: e.target.value as PaymentStatus,
                                })
                              }
                              className="rounded-md border border-white/15 bg-[#09090B] px-2.5 py-1.5 text-xs text-[#F5F2EB]"
                            >
                              <option value="free">Gratuito</option>
                              <option value="paid">Pago</option>
                              <option value="pending">Pendente</option>
                              <option value="expired">Expirado</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right font-mono-tabular text-xs text-[#D6D3D1]">
                            {item.metrics.whatsappClicks} / {item.metrics.callClicks}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Featured News Publisher */}
        {activeTab === 'news' && (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <form
              onSubmit={handlePublishNews}
              className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#121216] p-6 space-y-4"
            >
              <h2 className="text-base font-semibold text-[#F5F2EB]">
                Publicar Novidade em Destaque
              </h2>

              <div>
                <label htmlFor="news-title" className="block text-xs font-medium text-[#A8A29E]">
                  Título da Novidade *
                </label>
                <input
                  id="news-title"
                  type="text"
                  required
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="Título da atualização na Huíla"
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3 py-2 text-sm text-[#F5F2EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="news-cat" className="block text-xs font-medium text-[#A8A29E]">
                    Categoria
                  </label>
                  <select
                    id="news-cat"
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value as CategoryId)}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-2.5 py-2 text-xs text-[#F5F2EB]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="news-mun" className="block text-xs font-medium text-[#A8A29E]">
                    Município
                  </label>
                  <select
                    id="news-mun"
                    value={newsMunicipality}
                    onChange={(e) => setNewsMunicipality(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-2.5 py-2 text-xs text-[#F5F2EB]"
                  >
                    {HUILA_MUNICIPALITIES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="news-tag" className="block text-xs font-medium text-[#A8A29E]">
                  Etiqueta de Texto
                </label>
                <input
                  id="news-tag"
                  type="text"
                  value={newsTag}
                  onChange={(e) => setNewsTag(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>

              <div>
                <label htmlFor="news-related" className="block text-xs font-medium text-[#A8A29E]">
                  Associar a Empresa / Profissional (Opcional)
                </label>
                <select
                  id="news-related"
                  value={relatedListingId}
                  onChange={(e) => setRelatedListingId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-2.5 py-2 text-xs text-[#F5F2EB]"
                >
                  <option value="">Sem associação direta</option>
                  {listings
                    .filter((l) => l.status === 'approved')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="news-summary" className="block text-xs font-medium text-[#A8A29E]">
                  Resumo *
                </label>
                <textarea
                  id="news-summary"
                  required
                  rows={3}
                  value={newsSummary}
                  onChange={(e) => setNewsSummary(e.target.value)}
                  placeholder="Detalhes breves para o Dashboard de Novidades..."
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#09090B] px-3 py-2 text-sm text-[#F5F2EB]"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#09090B] hover:bg-[#E5C158] min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                Publicar no Dashboard
              </button>
            </form>

            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-base font-semibold text-[#F5F2EB]">
                Novidades Publicadas ({news.length})
              </h2>
              {news.length === 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-8 text-center text-sm text-[#A8A29E]">
                  Nenhuma novidade publicada até ao momento.
                </div>
              ) : (
                news.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#121216] p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="text-xs text-[#A8A29E]">
                        <span className="text-[#D4AF37] font-medium">{item.tag}</span> ·{' '}
                        {item.municipality} · {item.publishedAt}
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-[#F5F2EB]">{item.title}</h3>
                      <p className="mt-1 text-xs text-[#A8A29E]">{item.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNewsHighlight(item)}
                      className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold ${
                        item.isHighlighted
                          ? 'border-[#D4AF37]/50 text-[#D4AF37]'
                          : 'border-white/15 text-[#A8A29E]'
                      }`}
                    >
                      {item.isHighlighted ? 'Em Destaque' : 'Ocultado'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Testimonials Moderation */}
        {activeTab === 'testimonials' && (
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F2EB]">
                Moderação de Depoimentos de Usuários ({testimonials.length})
              </h2>
              <p className="mt-1 text-xs text-[#A8A29E]">
                Controle a visibilidade das avaliações publicadas na página inicial do Omuwa-Huíla.
              </p>
            </div>

            {testimonials.length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-[#121216] p-8 text-center text-sm text-[#A8A29E]">
                Ainda não existem depoimentos submetidos na plataforma.
              </div>
            ) : (
              <div className="space-y-4">
                {testimonials.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#121216] p-5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8A29E]">
                        <span className="font-semibold text-[#F5F2EB]">{item.authorName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#D4AF37]">{item.authorRole}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.municipality}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-mono-tabular text-[#D4AF37]">
                          <Star className="h-3 w-3 fill-[#D4AF37]" />
                          {item.rating}/5
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-[#D6D3D1]">
                        “{item.comment}”
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTestimonialVisibility(item)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                          item.isPublished
                            ? 'border-[#D4AF37]/50 text-[#D4AF37]'
                            : 'border-white/15 text-[#A8A29E]'
                        }`}
                      >
                        {item.isPublished ? 'Publicado' : 'Ocultado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTestimonial(item.id)}
                        aria-label={`Remover depoimento de ${item.authorName}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-500/35 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Team & Gestor Role Management */}
        {activeTab === 'team' && (
          <div className="mt-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#F5F2EB]">
                Equipa Administrativa &amp; Nomeação de Gestores
              </h2>
              <p className="mt-1 text-xs text-[#A8A29E]">
                Apenas o Administrador principal e os utilizadores nomeados como Gestores podem
                visualizar e operar este Painel Administrativo.
              </p>
            </div>

            {roleFeedback && (
              <div
                role="status"
                className="rounded-xl border border-[#D4AF37]/40 bg-[#1B1810] px-4 py-3 text-xs text-[#F5E6B3]"
              >
                {roleFeedback}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#121216]">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-xs text-[#A8A29E]">
                    <th className="px-4 py-3 font-medium">Utilizador</th>
                    <th className="px-4 py-3 font-medium">E-mail</th>
                    <th className="px-4 py-3 font-medium">Perfil de Acesso</th>
                    <th className="px-4 py-3 font-medium text-right">Permissões</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5 font-semibold text-[#F5F2EB]">{u.name}</td>
                      <td className="px-4 py-3.5 text-xs text-[#D6D3D1]">{u.email}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold">
                        {u.role === 'admin' && (
                          <span className="text-[#D4AF37]">Administrador</span>
                        )}
                        {u.role === 'gestor' && (
                          <span className="text-emerald-400">Gestor Autorizado</span>
                        )}
                        {u.role === 'user' && (
                          <span className="text-[#A8A29E]">Utilizador Padrão</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {u.role === 'admin' ? (
                          <span className="text-xs text-[#78716C]">Administrador principal</span>
                        ) : isRootAdmin ? (
                          u.role === 'user' ? (
                            <button
                              type="button"
                              onClick={() => handleChangeUserRole(u, 'gestor')}
                              aria-label={`Nomear ${u.name} como Gestor`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#09090B]"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Nomear Gestor
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleChangeUserRole(u, 'user')}
                              aria-label={`Remover cargo de Gestor de ${u.name}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-[#D6D3D1] hover:border-red-500/50 hover:text-red-300"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                              Remover Gestor
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-[#78716C]">
                            Gerido pelo Administrador
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-2 border-t border-white/[0.08] pt-5 text-xs text-[#78716C]">
          <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
          <span>
            Chaves privadas da Google Maps Platform mantidas exclusivamente no servidor; contactos
            exibidos sob interação direta para mitigar scraping automatizado.
          </span>
        </div>
      </div>
    </section>
  );
}
