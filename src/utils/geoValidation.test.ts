import test from 'node:test';
import assert from 'node:assert/strict';
import { ServiceListing } from '../types/marketplace';
import {
  buildContactLinks,
  detectGovernmentService,
  evaluateGeoValidation,
  filterListings,
  sortFeaturedListings,
} from './geoValidation';

const FIXTURE_LISTINGS: ServiceListing[] = [
  {
    id: 'test-1',
    name: 'Prestador Teste Construção',
    entityType: 'independent',
    category: 'construcao_manutencao',
    subcategory: 'Eletricistas',
    municipality: 'Lubango',
    serviceMode: 'deslocacao',
    coverageAreas: ['Lubango', 'Humpata'],
    description: 'Serviço técnico de eletricidade',
    requirementLabel: 'Área de Atuação',
    requirementValue: 'Lubango',
    phone: '+244 900 000 001',
    whatsapp: '244900000001',
    planTier: 'premium',
    status: 'approved',
    paymentStatus: 'paid',
    adOrder: 1,
    adDurationDays: 30,
    coverImage: '/src/assets/images/cat_construcao_tech_1794871691926.jpg',
    logoText: 'PT',
    popularScore: 90,
    isRecommended: true,
    geoVerification: {
      method: 'google_geocoding_verified',
      reason: 'Confirmado na Huíla',
      verifiedAt: '2026-11-16T00:00:00Z',
    },
    metrics: { views: 0, callClicks: 0, whatsappClicks: 0 },
    createdAt: '2026-11-16T00:00:00Z',
  },
  {
    id: 'test-2',
    name: 'Prestador Teste Comércio',
    entityType: 'company',
    category: 'comercio',
    subcategory: 'Lojas',
    municipality: 'Matala',
    serviceMode: 'estabelecimento',
    coverageAreas: ['Matala'],
    description: 'Comércio local',
    requirementLabel: 'Referência',
    requirementValue: 'Matala',
    phone: '+244 900 000 002',
    whatsapp: '244900000002',
    planTier: 'normal',
    status: 'approved',
    paymentStatus: 'free',
    adOrder: 99,
    adDurationDays: 0,
    coverImage: '/src/assets/images/cat_comercio_loja_1794871688604.jpg',
    logoText: 'PC',
    popularScore: 70,
    isRecommended: false,
    geoVerification: {
      method: 'google_geocoding_verified',
      reason: 'Confirmado na Huíla',
      verifiedAt: '2026-11-16T00:00:00Z',
    },
    metrics: { views: 0, callClicks: 0, whatsappClicks: 0 },
    createdAt: '2026-11-16T00:00:00Z',
  },
];

test('#01 Cadastro em Lubango com Geocoding da Huíla é aprovado automaticamente', () => {
  const result = evaluateGeoValidation({
    name: 'Padaria Planalto Dourado',
    description: 'Padaria e pastelaria privada no Lubango',
    municipality: 'Lubango',
    localityHint: 'Centro do Lubango',
    declaredNotGovernment: true,
    geocodingResult: {
      ok: true,
      formattedAddress: 'Lubango, Província da Huíla, Angola',
      administrativeArea: 'Huíla',
      countryCode: 'AO',
      lat: -14.9172,
      lng: 13.4925,
      placeId: 'ChIJ_lubango_test',
    },
  });

  assert.equal(result.status, 'approved');
  assert.equal(result.method, 'google_geocoding_verified');
  assert.equal(result.isGovernmentBlocked, false);
});

test('#02 Tentativa de cadastro fora da Huíla (ex: Luanda) é bloqueada automaticamente', () => {
  const result = evaluateGeoValidation({
    name: 'Transportes Atlântico',
    description: 'Serviço privado de entregas',
    municipality: 'Lubango',
    localityHint: 'Talatona, Luanda',
    declaredNotGovernment: true,
    geocodingResult: {
      ok: true,
      formattedAddress: 'Talatona, Luanda, Angola',
      administrativeArea: 'Luanda',
      countryCode: 'AO',
      lat: -8.9167,
      lng: 13.1833,
    },
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.method, 'outside_huila_blocked');
});

test('#03 Cadastro com endereço impreciso ou sem sinal do Google Maps entra em análise manual', () => {
  const noSignal = evaluateGeoValidation({
    name: 'Canalização Rápida Cacula',
    description: 'Reparações técnicas ao domicílio',
    municipality: 'Cacula',
    declaredNotGovernment: true,
    geocodingResult: {
      ok: false,
      networkError: true,
    },
  });

  assert.equal(noSignal.status, 'pending_review');
  assert.equal(noSignal.method, 'imprecise_manual_review');

  const imprecise = evaluateGeoValidation({
    name: 'Oficina Rural',
    description: 'Mecânica geral',
    municipality: 'Quipungo',
    localityHint: 'Zona rural sem referência exata',
    declaredNotGovernment: true,
  });

  assert.equal(imprecise.status, 'pending_review');
});

test('Bloqueia serviços prestados pelo governo na validação', () => {
  assert.equal(detectGovernmentService('Administração Municipal do Lubango', 'Atendimento público'), true);
  assert.equal(detectGovernmentService('Clínica Privada Serra da Leba', 'Consultas privadas'), false);

  const blocked = evaluateGeoValidation({
    name: 'Administração Municipal da Chibia',
    description: 'Serviço público estatal',
    municipality: 'Chibia',
    declaredNotGovernment: true,
  });

  assert.equal(blocked.status, 'rejected');
  assert.equal(blocked.isGovernmentBlocked, true);
  assert.equal(blocked.method, 'government_blocked');
});

test('#04 Pesquisa combinada por Categoria + Município da Huíla e ordenação de destaques', () => {
  const filtered = filterListings(FIXTURE_LISTINGS, {
    category: 'construcao_manutencao',
    municipality: 'Lubango',
    onlyApproved: true,
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'test-1');

  const featured = sortFeaturedListings(FIXTURE_LISTINGS);
  assert.equal(featured.length, 1);
  assert.equal(featured[0].adOrder, 1);
});

test('#06 Geração correta de links diretos para WhatsApp e Chamadas de Voz', () => {
  const links = buildContactLinks('+244 923 410 112', '923 410 112', 'Casa Serra da Leba');
  assert.equal(links.telHref, 'tel:+244923410112');
  assert.ok(links.whatsappHref.startsWith('https://wa.me/244923410112?text='));
});
