import { HUILA_MUNICIPALITIES } from '../data/huilaCatalog';
import { TestimonialAuthorRole, UserTestimonial } from '../types/marketplace';

export interface TestimonialInput {
  authorName: string;
  authorRole: TestimonialAuthorRole;
  municipality: string;
  rating: number;
  serviceContext?: string;
  comment: string;
}

export interface TestimonialValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: {
    authorName: string;
    authorRole: TestimonialAuthorRole;
    municipality: string;
    rating: number;
    serviceContext?: string;
    comment: string;
  };
}

const ALLOWED_ROLES: TestimonialAuthorRole[] = [
  'Cliente',
  'Empresa Parceira',
  'Profissional Independente',
];

export function validateTestimonialInput(
  input: Partial<TestimonialInput>
): TestimonialValidationResult {
  const authorName = (input.authorName || '').trim();
  const comment = (input.comment || '').trim();
  const municipality = (input.municipality || '').trim();
  const serviceContext = (input.serviceContext || '').trim();
  const rating = Number(input.rating);
  const authorRole: TestimonialAuthorRole = ALLOWED_ROLES.includes(
    input.authorRole as TestimonialAuthorRole
  )
    ? (input.authorRole as TestimonialAuthorRole)
    : 'Cliente';

  if (authorName.length < 2) {
    return { valid: false, error: 'Indique o seu nome completo (mínimo 2 caracteres).' };
  }

  if (!HUILA_MUNICIPALITIES.includes(municipality as (typeof HUILA_MUNICIPALITIES)[number])) {
    return {
      valid: false,
      error: 'Selecione um município válido da Província da Huíla.',
    };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { valid: false, error: 'Escolha uma classificação de 1 a 5 estrelas.' };
  }

  if (comment.length < 10) {
    return {
      valid: false,
      error: 'Escreva um depoimento com pelo menos 10 caracteres sobre a sua experiência.',
    };
  }

  if (comment.length > 500) {
    return {
      valid: false,
      error: 'O depoimento não deve ultrapassar 500 caracteres.',
    };
  }

  return {
    valid: true,
    sanitized: {
      authorName,
      authorRole,
      municipality,
      rating,
      serviceContext: serviceContext || undefined,
      comment,
    },
  };
}

export function computeTestimonialStats(items: UserTestimonial[]): {
  count: number;
  averageRating: number;
} {
  const published = items.filter((item) => item.isPublished);
  if (published.length === 0) {
    return { count: 0, averageRating: 0 };
  }
  const sum = published.reduce((acc, item) => acc + item.rating, 0);
  const averageRating = Math.round((sum / published.length) * 10) / 10;
  return { count: published.length, averageRating };
}
