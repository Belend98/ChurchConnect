import type { CreateUserModel } from "../entités/User"
import { z } from 'zod'

export const createUserSchema = z.object({
  username: z.string().trim().min(1, "Le nom d'utilisateur est requis").max(50),
  bio: z
    .string()
    .trim()
    .max(160, 'La bio est trop longue')
    .transform((value) => value || undefined)
    .optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type { CreateUserModel }

