import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { CATEGORIES, HUILA_MUNICIPALITIES, SEED_LISTINGS, SEED_NEWS } from './src/data/huilaCatalog';
import {
  AuthUser,
  CategoryId,
  EntityType,
  FeaturedNewsItem,
  PlanTier,
  ServiceListing,
  ServiceMode,
  UserRole,
  UserTestimonial,
} from './src/types/marketplace';
import {
  canAccessAdminPanel,
  canManageGestorRoles,
  hashPassword,
  signSessionToken,
  StoredUserRecord,
  verifyPassword,
  verifySessionToken,
} from './src/utils/authRules';
import {
  containsOutsideHuilaLocation,
  evaluateGeoValidation,
  filterListings,
  isImpreciseHint,
} from './src/utils/geoValidation';
import { validateTestimonialInput } from './src/utils/testimonials';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const SESSION_COOKIE_NAME = 'omuwa_session';
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'omuwa-huila-local-session-signing-key-2026';

const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@omuwa-huila.ao').toLowerCase();
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD || 'OmuwaAdmin2026!';

const GEOCODING_DAILY_LIMIT = 90;
const GEOCODING_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface GeoCacheEntry {
  expiresAt: number;
  data: {
    ok: boolean;
    quotaExceeded?: boolean;
    networkError?: boolean;
    formattedAddress?: string;
    administrativeArea?: string;
    countryCode?: string;
    granularity?: string;
    placeId?: string;
    lat?: number;
    lng?: number;
  };
}

interface PersistedState {
  listings: ServiceListing[];
  news: FeaturedNewsItem[];
  testimonials: UserTestimonial[];
  users: StoredUserRecord[];
  totalSearches: number;
  geocodingDailyCount: number;
  geocodingDateKey: string;
  geocodingCacheHits: number;
}

interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
}

const geoCache = new Map<string, GeoCacheEntry>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function createInitialAdmin(): StoredUserRecord {
  return {
    id: 'admin-root',
    name: 'Administrador Omuwa-Huíla',
    email: DEFAULT_ADMIN_EMAIL,
    role: 'admin',
    passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    createdAt: new Date().toISOString(),
  };
}

function loadState(): PersistedState {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedState;
      if (Array.isArray(parsed.listings) && Array.isArray(parsed.news)) {
        if (!Array.isArray(parsed.testimonials)) {
          parsed.testimonials = [];
        }
        if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
          parsed.users = [createInitialAdmin()];
        }
        if (parsed.geocodingDateKey !== todayKey()) {
          parsed.geocodingDailyCount = 0;
          parsed.geocodingDateKey = todayKey();
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Falha ao carregar estado persistido; iniciando estado limpo.', err);
  }
  return {
    listings: [...SEED_LISTINGS],
    news: [...SEED_NEWS],
    testimonials: [],
    users: [createInitialAdmin()],
    totalSearches: 0,
    geocodingDailyCount: 0,
    geocodingDateKey: todayKey(),
    geocodingCacheHits: 0,
  };
}

let state: PersistedState = loadState();

function saveState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Falha ao persistir estado local:', err);
  }
}

// Ensure initial admin exists on disk immediately
saveState();

function sanitizeUser(user: StoredUserRecord): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    result[key] = val;
  }
  return result;
}

function resolveSessionUser(req: Request): AuthUser | null {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) return null;
  const payload = verifySessionToken(token, SESSION_SECRET);
  if (!payload) return null;
  const user = state.users.find((u) => u.id === payload.userId);
  if (!user) return null;
  return sanitizeUser(user);
}

function setSessionCookie(res: Response, user: StoredUserRecord) {
  const token = signSessionToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    },
    SESSION_SECRET
  );
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
  );
}

function clearSessionCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  );
}

function requireAdminOrGestor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = resolveSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }
  if (!canAccessAdminPanel(user.role)) {
    res.status(403).json({
      error: 'Acesso restrito ao Administrador e Gestores autorizados.',
    });
    return;
  }
  req.authUser = user;
  next();
}

function requireAdminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = resolveSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }
  if (!canManageGestorRoles(user.role)) {
    res.status(403).json({
      error: 'Apenas o Administrador principal pode nomear ou remover Gestores.',
    });
    return;
  }
  req.authUser = user;
  next();
}

function getServerMapsApiKey(): string | undefined {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.MAPS_API_KEY
  );
}

async function verifyWithGoogleGeocoding(municipality: string, localityHint?: string) {
  if (state.geocodingDateKey !== todayKey()) {
    state.geocodingDailyCount = 0;
    state.geocodingDateKey = todayKey();
  }

  const queryAddress = localityHint?.trim()
    ? `${localityHint.trim()}, ${municipality}, Huíla, Angola`
    : `${municipality}, Huíla, Angola`;

  const cacheKey = queryAddress.toLowerCase();
  const cached = geoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    state.geocodingCacheHits += 1;
    saveState();
    return { ...cached.data, fromCache: true };
  }

  if (state.geocodingDailyCount >= GEOCODING_DAILY_LIMIT) {
    return { ok: false, quotaExceeded: true, networkError: true };
  }

  const apiKey = getServerMapsApiKey();
  if (!apiKey) {
    return { ok: false, networkError: true };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    state.geocodingDailyCount += 1;
    saveState();

    const encodedAddress = encodeURIComponent(queryAddress);
    const params = new URLSearchParams({
      regionCode: 'ao',
      languageCode: 'pt',
    });

    const url = `https://geocode.googleapis.com/v4/geocode/address/${encodedAddress}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        'X-Goog-FieldMask':
          'results.placeId,results.formattedAddress,results.location,results.postalAddress,results.addressComponents,results.granularity',
      },
    });

    if (response.status === 429) {
      return { ok: false, quotaExceeded: true, networkError: true };
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      if (errBody.includes('RESOURCE_EXHAUSTED')) {
        return { ok: false, quotaExceeded: true, networkError: true };
      }
      return { ok: false, networkError: true };
    }

    const json = (await response.json()) as {
      results?: Array<{
        placeId?: string;
        formattedAddress?: string;
        granularity?: string;
        location?: { latitude?: number; longitude?: number };
        postalAddress?: {
          regionCode?: string;
          administrativeArea?: string;
          locality?: string;
        };
        addressComponents?: Array<{
          longText?: string;
          shortText?: string;
          types?: string[];
        }>;
      }>;
    };

    const first = json.results?.[0];
    if (!first) {
      return { ok: false };
    }

    const adminComponent = first.addressComponents?.find((c) =>
      c.types?.includes('administrative_area_level_1')
    );
    const countryComponent = first.addressComponents?.find((c) => c.types?.includes('country'));

    const parsed = {
      ok: true,
      formattedAddress: first.formattedAddress,
      administrativeArea: first.postalAddress?.administrativeArea || adminComponent?.longText,
      countryCode: first.postalAddress?.regionCode || countryComponent?.shortText,
      granularity: first.granularity,
      placeId: first.placeId,
      lat: first.location?.latitude,
      lng: first.location?.longitude,
    };

    geoCache.set(cacheKey, {
      expiresAt: Date.now() + GEOCODING_CACHE_TTL_MS,
      data: parsed,
    });

    return { ...parsed, fromCache: false };
  } catch {
    return { ok: false, networkError: true };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // --- Auth Endpoints ---
  app.get('/api/auth/me', (req, res) => {
    const user = resolveSessionUser(req);
    res.json({ user });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';

    if (!cleanName || !cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Indique um nome válido e um endereço de e-mail.' });
      return;
    }

    if (cleanPassword.length < 6) {
      res.status(400).json({ error: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
      return;
    }

    const exists = state.users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      res.status(409).json({ error: 'Já existe uma conta registada com este e-mail.' });
      return;
    }

    const newUser: StoredUserRecord = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: 'user',
      passwordHash: hashPassword(cleanPassword),
      createdAt: new Date().toISOString(),
    };

    state.users.push(newUser);
    saveState();
    setSessionCookie(res, newUser);
    res.status(201).json({ user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = state.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user || !verifyPassword(password || '', user.passwordHash)) {
      res.status(401).json({ error: 'E-mail ou palavra-passe incorretos.' });
      return;
    }

    setSessionCookie(res, user);
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  // --- Public Listings ---
  app.get('/api/listings', (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const municipality = typeof req.query.municipality === 'string' ? req.query.municipality : 'all';
    const category =
      typeof req.query.category === 'string' ? (req.query.category as CategoryId | 'all') : 'all';
    const entityType =
      typeof req.query.entityType === 'string'
        ? (req.query.entityType as EntityType | 'all')
        : 'all';

    if (query.trim() || municipality !== 'all' || category !== 'all') {
      state.totalSearches += 1;
      saveState();
    }

    const filtered = filterListings(state.listings, {
      query,
      municipality,
      category,
      entityType,
      onlyApproved: true,
    });

    res.json({
      listings: filtered,
      total: filtered.length,
    });
  });

  // Register new company or independent professional
  app.post('/api/listings/register', async (req, res) => {
    const authUser = resolveSessionUser(req);
    const body = req.body as {
      name?: string;
      entityType?: EntityType;
      category?: CategoryId;
      subcategory?: string;
      municipality?: string;
      localityHint?: string;
      serviceMode?: ServiceMode;
      coverageAreas?: string[];
      description?: string;
      requirementValue?: string;
      phone?: string;
      whatsapp?: string;
      planTier?: PlanTier;
      declaredNotGovernment?: boolean;
      simulateNoSignal?: boolean;
    };

    const name = (body.name || '').trim();
    const description = (body.description || '').trim();
    const municipality = (body.municipality || '').trim();
    const localityHint = (body.localityHint || '').trim();
    const phone = (body.phone || '').trim();
    const whatsapp = (body.whatsapp || phone).trim();

    if (!name || !municipality || !description || !phone || !body.category) {
      res.status(400).json({
        error: 'Preencha todos os campos obrigatórios (nome, categoria, município, descrição e telefone).',
      });
      return;
    }

    const outsidePreCheck = containsOutsideHuilaLocation(localityHint);
    const imprecisePreCheck = isImpreciseHint(localityHint) || Boolean(body.simulateNoSignal);

    let geocodingResult:
      | Awaited<ReturnType<typeof verifyWithGoogleGeocoding>>
      | undefined;

    if (!outsidePreCheck && !imprecisePreCheck && body.declaredNotGovernment) {
      geocodingResult = await verifyWithGoogleGeocoding(municipality, localityHint);
    } else if (body.simulateNoSignal) {
      geocodingResult = { ok: false, networkError: true };
    }

    const decision = evaluateGeoValidation({
      name,
      description,
      municipality,
      localityHint,
      declaredNotGovernment: Boolean(body.declaredNotGovernment),
      geocodingResult,
    });

    if (decision.status === 'rejected') {
      res.status(422).json({
        status: decision.status,
        method: decision.method,
        message: decision.reason,
        quotaExceeded: Boolean(geocodingResult && 'quotaExceeded' in geocodingResult && geocodingResult.quotaExceeded),
      });
      return;
    }

    const catMeta = CATEGORIES.find((c) => c.id === body.category) || CATEGORIES[0];
    const planTier: PlanTier = body.planTier === 'premium' ? 'premium' : 'normal';
    const coverage =
      Array.isArray(body.coverageAreas) && body.coverageAreas.length > 0
        ? body.coverageAreas
        : [municipality];

    const words = name.split(/\s+/).filter(Boolean);
    const logoText =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const newListing: ServiceListing = {
      id: `huila-${Date.now()}`,
      ownerUserId: authUser?.id,
      name,
      entityType: body.entityType === 'independent' ? 'independent' : 'company',
      category: catMeta.id,
      subcategory: body.subcategory || catMeta.subcategories[0],
      municipality,
      localityHint: localityHint || undefined,
      serviceMode: body.serviceMode || (body.entityType === 'independent' ? 'domicilio' : 'estabelecimento'),
      coverageAreas: coverage,
      description,
      requirementLabel: catMeta.profileRequirementLabel,
      requirementValue: body.requirementValue?.trim() || 'Verificado na Província da Huíla',
      phone,
      whatsapp: whatsapp.replace(/\D/g, ''),
      planTier,
      status: decision.status,
      paymentStatus: planTier === 'premium' ? 'pending' : 'free',
      adOrder: planTier === 'premium' ? 10 : 99,
      adDurationDays: planTier === 'premium' ? 30 : 0,
      coverImage: catMeta.defaultCoverImage,
      logoText,
      popularScore: planTier === 'premium' ? 85 : 65,
      isRecommended: planTier === 'premium',
      geoVerification: {
        method: decision.method,
        reason: decision.reason,
        formattedAddress: decision.formattedAddress,
        placeId: decision.placeId,
        verifiedAt: new Date().toISOString(),
      },
      metrics: { views: 0, callClicks: 0, whatsappClicks: 0 },
      createdAt: new Date().toISOString(),
    };

    state.listings.unshift(newListing);
    saveState();

    res.status(201).json({
      listing: newListing,
      status: decision.status,
      method: decision.method,
      message: decision.reason,
      quotaExceeded: Boolean(geocodingResult && 'quotaExceeded' in geocodingResult && geocodingResult.quotaExceeded),
    });
  });

  app.post('/api/listings/:id/track-click', (req, res) => {
    const { id } = req.params;
    const { type } = req.body as { type?: 'call' | 'whatsapp' | 'view' };
    const listing = state.listings.find((item) => item.id === id);
    if (!listing) {
      res.status(404).json({ error: 'Registo não encontrado.' });
      return;
    }

    if (type === 'call') listing.metrics.callClicks += 1;
    else if (type === 'whatsapp') listing.metrics.whatsappClicks += 1;
    else if (type === 'view') listing.metrics.views += 1;

    listing.popularScore = Math.min(
      100,
      Math.round(
        60 +
          listing.metrics.whatsappClicks * 0.2 +
          listing.metrics.callClicks * 0.3 +
          listing.metrics.views * 0.05
      )
    );
    saveState();

    res.json({ metrics: listing.metrics });
  });

  // Public Featured News
  app.get('/api/news', (_req, res) => {
    res.json({ news: state.news });
  });

  // Public User Testimonials
  app.get('/api/testimonials', (_req, res) => {
    res.json({
      testimonials: state.testimonials.filter((t) => t.isPublished),
    });
  });

  app.post('/api/testimonials', (req, res) => {
    const check = validateTestimonialInput(req.body);
    if (!check.valid || !check.sanitized) {
      res.status(400).json({ error: check.error || 'Dados inválidos para o depoimento.' });
      return;
    }

    const item: UserTestimonial = {
      id: `test-${Date.now()}`,
      authorName: check.sanitized.authorName,
      authorRole: check.sanitized.authorRole,
      municipality: check.sanitized.municipality,
      rating: check.sanitized.rating,
      serviceContext: check.sanitized.serviceContext,
      comment: check.sanitized.comment,
      isPublished: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    state.testimonials.unshift(item);
    saveState();
    res.status(201).json({ testimonial: item });
  });

  // --- Protected Admin & Gestor Routes ---
  app.post('/api/news', requireAdminOrGestor, (req, res) => {
    const body = req.body as {
      title?: string;
      summary?: string;
      category?: CategoryId;
      municipality?: string;
      tag?: string;
      relatedListingId?: string;
    };
    if (!body.title?.trim() || !body.summary?.trim()) {
      res.status(400).json({ error: 'Título e resumo da novidade são obrigatórios.' });
      return;
    }
    const related = state.listings.find((l) => l.id === body.relatedListingId);
    const item: FeaturedNewsItem = {
      id: `news-${Date.now()}`,
      title: body.title.trim(),
      summary: body.summary.trim(),
      category: body.category || 'comercio',
      municipality: body.municipality || HUILA_MUNICIPALITIES[0],
      relatedListingId: related?.id,
      relatedListingName: related?.name,
      isHighlighted: true,
      publishedAt: new Date().toISOString().slice(0, 10),
      tag: body.tag?.trim() || 'Novidade em Destaque',
    };
    state.news.unshift(item);
    saveState();
    res.status(201).json({ newsItem: item });
  });

  app.get('/api/admin/overview', requireAdminOrGestor, (_req, res) => {
    const active = state.listings.filter((l) => l.status === 'approved');
    const pending = state.listings.filter((l) => l.status === 'pending_review');
    const totalCallClicks = state.listings.reduce((acc, l) => acc + l.metrics.callClicks, 0);
    const totalWhatsappClicks = state.listings.reduce((acc, l) => acc + l.metrics.whatsappClicks, 0);
    const totalProfileViews = state.listings.reduce((acc, l) => acc + l.metrics.views, 0);

    res.json({
      listings: state.listings,
      news: state.news,
      testimonials: state.testimonials,
      users: state.users.map(sanitizeUser),
      metrics: {
        totalActiveListings: active.length,
        totalCompanies: active.filter((l) => l.entityType === 'company').length,
        totalIndependents: active.filter((l) => l.entityType === 'independent').length,
        pendingReviewCount: pending.length,
        premiumActiveCount: active.filter((l) => l.planTier === 'premium').length,
        totalSearches: state.totalSearches,
        totalCallClicks,
        totalWhatsappClicks,
        totalProfileViews,
        geocodingDailyCount: state.geocodingDailyCount,
        geocodingDailyLimit: GEOCODING_DAILY_LIMIT,
        geocodingCacheEntries: geoCache.size,
        geocodingCacheHits: state.geocodingCacheHits,
      },
    });
  });

  app.patch('/api/admin/listings/:id', requireAdminOrGestor, (req, res) => {
    const { id } = req.params;
    const listing = state.listings.find((item) => item.id === id);
    if (!listing) {
      res.status(404).json({ error: 'Empresa ou profissional não encontrado.' });
      return;
    }

    const patch = req.body as Partial<
      Pick<ServiceListing, 'status' | 'planTier' | 'paymentStatus' | 'adOrder' | 'adDurationDays' | 'isRecommended'>
    > & { adminNote?: string };

    if (patch.status) {
      listing.status = patch.status;
      if (patch.status === 'approved' && listing.geoVerification.method === 'imprecise_manual_review') {
        listing.geoVerification = {
          ...listing.geoVerification,
          method: 'admin_manual_override',
          reason: patch.adminNote || 'Localização verificada e aprovada manualmente pela administração.',
          verifiedAt: new Date().toISOString(),
        };
      }
    }
    if (patch.planTier) {
      listing.planTier = patch.planTier;
      if (patch.planTier === 'premium' && listing.paymentStatus === 'free') {
        listing.paymentStatus = 'paid';
        listing.adDurationDays = listing.adDurationDays || 30;
        listing.adOrder = listing.adOrder >= 99 ? 5 : listing.adOrder;
      } else if (patch.planTier === 'normal') {
        listing.paymentStatus = 'free';
        listing.adOrder = 99;
      }
    }
    if (patch.paymentStatus) listing.paymentStatus = patch.paymentStatus;
    if (typeof patch.adOrder === 'number') listing.adOrder = patch.adOrder;
    if (typeof patch.adDurationDays === 'number') listing.adDurationDays = patch.adDurationDays;
    if (typeof patch.isRecommended === 'boolean') listing.isRecommended = patch.isRecommended;

    saveState();
    res.json({ listing });
  });

  app.patch('/api/admin/news/:id', requireAdminOrGestor, (req, res) => {
    const { id } = req.params;
    const item = state.news.find((n) => n.id === id);
    if (!item) {
      res.status(404).json({ error: 'Novidade não encontrada.' });
      return;
    }
    const { isHighlighted } = req.body as { isHighlighted?: boolean };
    if (typeof isHighlighted === 'boolean') item.isHighlighted = isHighlighted;
    saveState();
    res.json({ newsItem: item });
  });

  app.patch('/api/admin/testimonials/:id', requireAdminOrGestor, (req, res) => {
    const { id } = req.params;
    const item = state.testimonials.find((t) => t.id === id);
    if (!item) {
      res.status(404).json({ error: 'Depoimento não encontrado.' });
      return;
    }
    const { isPublished } = req.body as { isPublished?: boolean };
    if (typeof isPublished === 'boolean') item.isPublished = isPublished;
    saveState();
    res.json({ testimonial: item });
  });

  app.delete('/api/admin/testimonials/:id', requireAdminOrGestor, (req, res) => {
    const { id } = req.params;
    const idx = state.testimonials.findIndex((t) => t.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Depoimento não encontrado.' });
      return;
    }
    state.testimonials.splice(idx, 1);
    saveState();
    res.json({ ok: true });
  });

  // Administrator-only Gestor nomination & role management
  app.patch('/api/admin/users/:id/role', requireAdminOnly, (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { role } = req.body as { role?: UserRole };

    if (role !== 'gestor' && role !== 'user') {
      res.status(400).json({ error: 'Cargo inválido. Use "gestor" ou "user".' });
      return;
    }

    const target = state.users.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ error: 'Utilizador não encontrado.' });
      return;
    }

    if (target.id === req.authUser?.id || target.role === 'admin') {
      res.status(400).json({ error: 'Não é possível alterar o cargo do Administrador principal.' });
      return;
    }

    target.role = role;
    saveState();
    res.json({ user: sanitizeUser(target) });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Omuwa-Huíla servidor ativo em http://localhost:${PORT}`);
  });
}

startServer();
