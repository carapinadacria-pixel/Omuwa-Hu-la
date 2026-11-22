import assert from 'node:assert/strict';
import test from 'node:test';
import { UserTestimonial } from '../types/marketplace';
import { computeTestimonialStats, validateTestimonialInput } from './testimonials';

test('Valida e normaliza depoimento válido na Província da Huíla', () => {
  const res = validateTestimonialInput({
    authorName: '  Mariana Tchissola ',
    authorRole: 'Cliente',
    municipality: 'Lubango',
    rating: 5,
    serviceContext: ' Reparação elétrica ',
    comment: 'Encontrei um profissional no Lubango rapidamente e o atendimento foi excelente.',
  });

  assert.equal(res.valid, true);
  assert.equal(res.sanitized?.authorName, 'Mariana Tchissola');
  assert.equal(res.sanitized?.municipality, 'Lubango');
  assert.equal(res.sanitized?.rating, 5);
  assert.equal(res.sanitized?.serviceContext, 'Reparação elétrica');
});

test('Rejeita depoimentos fora dos municípios da Huíla ou com texto demasiado curto', () => {
  const badMunicipality = validateTestimonialInput({
    authorName: 'João Silva',
    authorRole: 'Cliente',
    municipality: 'Luanda',
    rating: 5,
    comment: 'Bom serviço na minha região.',
  });
  assert.equal(badMunicipality.valid, false);

  const shortComment = validateTestimonialInput({
    authorName: 'João Silva',
    authorRole: 'Cliente',
    municipality: 'Lubango',
    rating: 4,
    comment: 'Bom',
  });
  assert.equal(shortComment.valid, false);

  const badRating = validateTestimonialInput({
    authorName: 'João Silva',
    authorRole: 'Cliente',
    municipality: 'Matala',
    rating: 7,
    comment: 'Excelente atendimento no município da Matala.',
  });
  assert.equal(badRating.valid, false);
});

test('Calcula média e total apenas sobre depoimentos publicados', () => {
  assert.deepEqual(computeTestimonialStats([]), { count: 0, averageRating: 0 });

  const sample: UserTestimonial[] = [
    {
      id: 't1',
      authorName: 'Ana Paula',
      authorRole: 'Cliente',
      municipality: 'Lubango',
      rating: 5,
      comment: 'Atendimento pontual ao domicílio.',
      isPublished: true,
      createdAt: '2026-11-10',
    },
    {
      id: 't2',
      authorName: 'Pedro Costa',
      authorRole: 'Empresa Parceira',
      municipality: 'Chibia',
      rating: 4,
      comment: 'Ajudou a receber novos contactos na Chibia.',
      isPublished: true,
      createdAt: '2026-11-11',
    },
    {
      id: 't3',
      authorName: 'Oculto',
      authorRole: 'Cliente',
      municipality: 'Humpata',
      rating: 1,
      comment: 'Comentário ocultado pela moderação.',
      isPublished: false,
      createdAt: '2026-11-12',
    },
  ];

  assert.deepEqual(computeTestimonialStats(sample), {
    count: 2,
    averageRating: 4.5,
  });
});
