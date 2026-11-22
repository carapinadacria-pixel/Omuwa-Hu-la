import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AuthView } from './components/AuthView';
import { DirectoryGrid } from './components/DirectoryGrid';
import { FeaturedDashboard } from './components/FeaturedDashboard';
import { HeroSpotlight } from './components/HeroSpotlight';
import { ListingProfileModal } from './components/ListingProfileModal';
import { ActiveSection, Navbar } from './components/Navbar';
import { PlansSection } from './components/PlansSection';
import { RegistrationView } from './components/RegistrationView';
import { TestimonialsSection } from './components/TestimonialsSection';
import { BRAND_LOGO_URL, SEED_LISTINGS, SEED_NEWS } from './data/huilaCatalog';
import {
  AuthUser,
  CategoryId,
  EntityType,
  FeaturedNewsItem,
  ListingStatus,
  PlanTier,
  ServiceListing,
  UserTestimonial,
} from './types/marketplace';
import { canAccessAdminPanel } from './utils/authRules';
import { filterListings, sortFeaturedListings } from './utils/geoValidation';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveSection>('home');
  const [registerPlan, setRegisterPlan] = useState<PlanTier>('normal');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [listings, setListings] = useState<ServiceListing[]>(
    SEED_LISTINGS.filter((l) => l.status === 'approved')
  );
  const [allListingsCountPending, setAllListingsCountPending] = useState<number>(0);
  const [newsItems, setNewsItems] = useState<FeaturedNewsItem[]>(SEED_NEWS);
  const [testimonials, setTestimonials] = useState<UserTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | 'all'>('all');

  // Profile modal
  const [selectedProfile, setSelectedProfile] = useState<ServiceListing | null>(null);

  // Google Maps Demo Key Quota Warning state
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handler = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  const refreshMarketplace = useCallback(async () => {
    setIsLoading(true);
    try {
      const [meRes, listingsRes, newsRes, testimonialsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/listings'),
        fetch('/api/news'),
        fetch('/api/testimonials'),
      ]);

      let resolvedUser: AuthUser | null = null;
      if (meRes.ok) {
        const meData = (await meRes.json()) as { user: AuthUser | null };
        resolvedUser = meData.user;
        setCurrentUser(resolvedUser);
      }

      if (listingsRes.ok) {
        const data = (await listingsRes.json()) as { listings: ServiceListing[] };
        setListings(data.listings);
      }
      if (newsRes.ok) {
        const data = (await newsRes.json()) as { news: FeaturedNewsItem[] };
        setNewsItems(data.news);
      }
      if (testimonialsRes.ok) {
        const data = (await testimonialsRes.json()) as { testimonials: UserTestimonial[] };
        setTestimonials(data.testimonials);
      }

      if (canAccessAdminPanel(resolvedUser?.role)) {
        const adminRes = await fetch('/api/admin/overview');
        if (adminRes.ok) {
          const data = (await adminRes.json()) as {
            metrics: { pendingReviewCount: number };
          };
          setAllListingsCountPending(data.metrics.pendingReviewCount);
        }
      } else {
        setAllListingsCountPending(0);
      }
    } catch {
      // Retain current state gracefully if offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMarketplace();
  }, [refreshMarketplace]);

  const filteredListings = useMemo(() => {
    return filterListings(listings, {
      query: searchQuery,
      municipality: selectedMunicipality,
      category: selectedCategory,
      entityType: selectedEntityType,
      onlyApproved: true,
    });
  }, [listings, searchQuery, selectedMunicipality, selectedCategory, selectedEntityType]);

  const featuredListings = useMemo(() => {
    return sortFeaturedListings(listings);
  }, [listings]);

  // Debounced server search telemetry call
  useEffect(() => {
    if (
      searchQuery.trim() === '' &&
      selectedMunicipality === 'all' &&
      selectedCategory === 'all' &&
      selectedEntityType === 'all'
    ) {
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedMunicipality !== 'all') params.set('municipality', selectedMunicipality);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedEntityType !== 'all') params.set('entityType', selectedEntityType);
      fetch(`/api/listings?${params.toString()}`).catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedMunicipality, selectedCategory, selectedEntityType]);

  const handleTrackClick = async (id: string, type: 'call' | 'whatsapp' | 'view') => {
    try {
      const res = await fetch(`/api/listings/${id}/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = (await res.json()) as { metrics: ServiceListing['metrics'] };
        setListings((prev) =>
          prev.map((item) => (item.id === id ? { ...item, metrics: data.metrics } : item))
        );
        setSelectedProfile((prev) =>
          prev && prev.id === id ? { ...prev, metrics: data.metrics } : prev
        );
      }
    } catch {
      // Non-blocking telemetry
    }
  };

  const handleNavigateView = (view: ActiveSection, sectionId?: string) => {
    if (view === 'admin' && !canAccessAdminPanel(currentUser?.role)) {
      setActiveView('auth');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    setActiveView(view);
    if (view === 'home' && sectionId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleOpenRegister = (plan: PlanTier = 'normal') => {
    setRegisterPlan(plan);
    setActiveView('register');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedMunicipality('all');
    setSelectedCategory('all');
    setSelectedEntityType('all');
  };

  const handleOpenListingById = (id: string) => {
    const found = listings.find((l) => l.id === id);
    if (found) {
      handleTrackClick(found.id, 'view');
      setSelectedProfile(found);
    }
  };

  const handleRegistrationSuccess = (
    listing: ServiceListing,
    status: ListingStatus
  ) => {
    if (status === 'approved') {
      setListings((prev) => [listing, ...prev]);
    } else if (status === 'pending_review') {
      setAllListingsCountPending((prev) => prev + 1);
    }
    refreshMarketplace();
  };

  const handleAuthenticated = async (user: AuthUser) => {
    setCurrentUser(user);
    await refreshMarketplace();
    if (canAccessAdminPanel(user.role)) {
      setActiveView('admin');
    } else {
      setActiveView('home');
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setCurrentUser(null);
    setAllListingsCountPending(0);
    if (activeView === 'admin') {
      setActiveView('home');
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const showAdminAccess = canAccessAdminPanel(currentUser?.role);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#F5F2EB] flex flex-col">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Navbar
        activeView={activeView}
        onNavigateView={handleNavigateView}
        pendingCount={allListingsCountPending}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activeView === 'home' && (
          <>
            <HeroSpotlight
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedMunicipality={selectedMunicipality}
              onMunicipalityChange={setSelectedMunicipality}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedEntityType={selectedEntityType}
              onEntityTypeChange={setSelectedEntityType}
              activeCount={listings.length}
              onOpenRegister={() => handleOpenRegister('normal')}
              onResetFilters={handleResetFilters}
            />

            <FeaturedDashboard
              featuredListings={featuredListings}
              newsItems={newsItems}
              allApproved={listings}
              onOpenProfile={(listing) => setSelectedProfile(listing)}
              onTrackClick={handleTrackClick}
              onOpenListingById={handleOpenListingById}
              onOpenRegisterPremium={() => handleOpenRegister('premium')}
            />

            <TestimonialsSection
              testimonials={testimonials}
              currentUser={currentUser}
              onTestimonialAdded={(newItem) => setTestimonials((prev) => [newItem, ...prev])}
            />

            <DirectoryGrid
              listings={filteredListings}
              isLoading={isLoading}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              onOpenProfile={(listing) => setSelectedProfile(listing)}
              onTrackClick={handleTrackClick}
              onResetFilters={handleResetFilters}
              onOpenRegister={() => handleOpenRegister('normal')}
            />

            <PlansSection onSelectPlan={(plan) => handleOpenRegister(plan)} />
          </>
        )}

        {activeView === 'register' && (
          <RegistrationView
            initialPlan={registerPlan}
            onCancel={() => handleNavigateView('home')}
            onSuccess={handleRegistrationSuccess}
          />
        )}

        {activeView === 'auth' && (
          <AuthView
            onCancel={() => handleNavigateView('home')}
            onAuthenticated={handleAuthenticated}
          />
        )}

        {activeView === 'admin' && showAdminAccess && currentUser && (
          <AdminPanel
            currentUser={currentUser}
            onBackToSite={() => handleNavigateView('home')}
            onDataMutated={refreshMarketplace}
          />
        )}
      </main>

      <footer className="border-t border-white/[0.08] bg-[#09090B] py-8">
        <div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-4 px-5 text-xs text-[#78716C] md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src={BRAND_LOGO_URL}
              alt="Logotipo Omuwa-Huíla"
              className="h-6 w-6 rounded-full border border-[#D4AF37]/50 object-cover shrink-0"
            />
            <div>
              <span className="font-display text-sm font-semibold text-[#F5F2EB]">
                Omuwa-<span className="text-[#D4AF37]">Huíla</span>
              </span>{' '}
              · Marketplace exclusivo de empresas privadas e profissionais independentes na
              Província da Huíla, Angola.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <button
              type="button"
              onClick={() => handleNavigateView('home', 'explorar')}
              className="hover:text-[#D4AF37]"
            >
              Explorar Serviços
            </button>
            <button
              type="button"
              onClick={() => handleOpenRegister('normal')}
              className="hover:text-[#D4AF37]"
            >
              Cadastrar
            </button>
            {!currentUser ? (
              <button
                type="button"
                onClick={() => handleNavigateView('auth')}
                className="hover:text-[#D4AF37]"
              >
                Login
              </button>
            ) : (
              showAdminAccess && (
                <button
                  type="button"
                  onClick={() => handleNavigateView('admin')}
                  className="hover:text-[#D4AF37]"
                >
                  Administração
                </button>
              )
            )}
          </div>
        </div>
      </footer>

      <ListingProfileModal
        listing={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        onTrackClick={handleTrackClick}
      />
    </div>
  );
}
