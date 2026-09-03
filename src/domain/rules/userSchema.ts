import type { CreateProfilModel } from '../entités/User'
import { z } from 'zod'

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .max(50, "Le nom d'utilisateur est trop long")
    .transform((value) => value || undefined)
    .optional(),
  nom: z
    .string()
    .trim()
    .max(80, 'Le nom est trop long')
    .transform((value) => value || undefined)
    .optional(),
  prenom: z
    .string()
    .trim()
    .max(80, 'Le prénom est trop long')
    .transform((value) => value || undefined)
    .optional(),
  bio: z
    .string()
    .trim()
    .max(160, 'La bio est trop longue')
    .transform((value) => value || undefined)
    .optional(),
  dateNaissance: z
    .string()
    .trim()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: 'La date de naissance est invalide',
    })
    .transform((value) => (value ? new Date(value) : undefined))
    .optional(),
})

export type CreateUserFormInput = z.input<typeof createUserSchema>
export type CreateUserInput = z.output<typeof createUserSchema>
export type { CreateProfilModel }
