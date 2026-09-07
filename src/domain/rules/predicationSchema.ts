import { z } from 'zod'

export const createPredicationSchema = z.object({
  categorieId: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || z.string().uuid().safeParse(value).success,
      'La catégorie doit être un identifiant UUID valide.',
    ),
  durationMinutes: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || Number.isFinite(Number(value)),
      'La durée doit être un nombre.',
    ),
  mediaUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || z.string().url().safeParse(value).success,
      'Entre une URL audio valide.',
    ),
  title: z.string().trim().min(1, 'Le titre est obligatoire.'),
})

export type CreatePredicationInput = z.infer<typeof createPredicationSchema>
