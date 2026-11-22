import { CategoryMeta, FeaturedNewsItem, ServiceListing } from '../types/marketplace';

export const BRAND_LOGO_URL = '/assets/aistudio/IMG_3823_fe917d70.jpeg';
export const HERO_IMAGE = '/src/assets/images/hero_lubango_sunset_1794871689415.jpg';

export const HUILA_MUNICIPALITIES = [
  'Lubango',
  'Caconda',
  'Cacula',
  'Caluquembe',
  'Chiange (Gambos)',
  'Chibia',
  'Chicomba',
  'Chipindo',
  'Cuvango',
  'Humpata',
  'Jamba',
  'Matala',
  'Quilengues',
  'Quipungo',
] as const;

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'comercio',
    name: 'Comércio',
    subcategories: ['Lojas', 'Supermercados', 'Vestuário', 'Utilidades', 'Eletrodomésticos'],
    profileRequirementLabel: 'NIF Empresa / Referência de Loja',
    profileRequirementPlaceholder: 'Indique o NIF ou localização comercial da loja',
    defaultCoverImage: '/src/assets/images/cat_comercio_loja_1794871688604.jpg',
  },
  {
    id: 'alimentacao_alojamento',
    name: 'Alimentação & Alojamento',
    subcategories: ['Restaurantes', 'Pastelarias', 'Hotéis', 'Hospedarias', 'Catering'],
    profileRequirementLabel: 'Horários / Menu / Especialidade',
    profileRequirementPlaceholder: 'Indique horários de funcionamento e especialidades',
    defaultCoverImage: '/src/assets/images/cat_alimentacao_restaurante_1794871690243.jpg',
  },
  {
    id: 'construcao_manutencao',
    name: 'Construção & Manutenção',
    subcategories: ['Pedreiros', 'Eletricistas', 'Canalizadores', 'Pintores', 'Serralharia'],
    profileRequirementLabel: 'Área de Atuação / Portfólio',
    profileRequirementPlaceholder: 'Descreva a área de atuação e serviços técnicos',
    defaultCoverImage: '/src/assets/images/cat_construcao_tech_1794871691926.jpg',
  },
  {
    id: 'saude_bem_estar',
    name: 'Saúde & Bem-Estar',
    subcategories: ['Clínicas Privadas', 'Farmácias', 'Cabeleireiros', 'Centros de Estética', 'Barbearias'],
    profileRequirementLabel: 'Licença / Especialidades',
    profileRequirementPlaceholder: 'Indique especialidades ou licença de funcionamento',
    defaultCoverImage: '/src/assets/images/cat_saude_bemestar_1794871691918.jpg',
  },
  {
    id: 'educacao_formacao',
    name: 'Educação & Formação',
    subcategories: ['Escolas Privadas', 'Explicadores', 'Centros de Formação', 'Idiomas'],
    profileRequirementLabel: 'Modalidade / Cursos',
    profileRequirementPlaceholder: 'Indique os cursos ou disciplinas lecionadas',
    defaultCoverImage: '/src/assets/images/cat_saude_bemestar_1794871691918.jpg',
  },
  {
    id: 'transportes_logistica',
    name: 'Transportes & Logística',
    subcategories: ['Táxis Privados', 'Entregas Express', 'Fretes & Mudanças', 'Mercadorias'],
    profileRequirementLabel: 'Frota / Zonas de Cobertura',
    profileRequirementPlaceholder: 'Indique o tipo de viatura e municípios cobertos',
    defaultCoverImage: '/src/assets/images/cat_construcao_tech_1794871691926.jpg',
  },
  {
    id: 'tecnologia_servicos',
    name: 'Tecnologia & Serviços',
    subcategories: ['Informática', 'Design & Branding', 'Contabilidade', 'Consultoria', 'Redes'],
    profileRequirementLabel: 'Serviços / Atendimento Remoto',
    profileRequirementPlaceholder: 'Indique os serviços prestados e disponibilidade remota',
    defaultCoverImage: '/src/assets/images/cat_comercio_loja_1794871688604.jpg',
  },
  {
    id: 'trabalhadores_independentes',
    name: 'Trabalhadores Independentes',
    subcategories: ['Limpeza', 'Lavandaria', 'Jardinagem', 'Reparações ao Domicílio', 'Costura'],
    profileRequirementLabel: 'BI Verificado / Serviços ao Domicílio',
    profileRequirementPlaceholder: 'Indique o atendimento ao domicílio e disponibilidade',
    defaultCoverImage: '/src/assets/images/cat_alimentacao_restaurante_1794871690243.jpg',
  },
];

// Sem dados fictícios de empresas ou informações administrativas inventadas.
// O diretório é populado exclusivamente por cadastros reais submetidos e validados.
export const SEED_LISTINGS: ServiceListing[] = [];

export const SEED_NEWS: FeaturedNewsItem[] = [];
