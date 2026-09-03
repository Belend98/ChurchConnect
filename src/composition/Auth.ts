import { AuthService } from "@/application/AuthService"
import { SupabaseAuthRepository } from "@/infrastructure/auth/SupabaseAuthRepository"

const authRepository = new SupabaseAuthRepository()

export const authService = new AuthService(authRepository)
