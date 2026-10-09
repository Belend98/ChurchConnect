import type { CreateProfilModel } from '../entities/Profil'
import { z } from 'zod'
import { formatDateOnly, isValidDateOnly } from '@/shared/utils/dateOnly'

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
    .refine((value) => !value || isValidDateOnly(value), {
      message: 'La date de naissance est invalide',
    })
    .refine((value) => !value || value <= formatDateOnly(new Date()), {
      message: 'Date de naissance invalide',
    })
    .transform((value) => (value ? new Date(value) : undefined))
    .optional(),
})

export type CreateUserFormInput = z.input<typeof createUserSchema>
export type CreateUserInput = z.output<typeof createUserSchema>
export type { CreateProfilModel }
