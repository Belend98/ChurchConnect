import { z } from 'zod'

const baseSignSchema = z.object({
  email: z.email('Adresse email invalide').trim(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(72, 'Le mot de passe est trop long'),
})

export const signInSchema = baseSignSchema

export const signUpSchema = baseSignSchema.extend({
  confirmPassword: z
    .string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>

