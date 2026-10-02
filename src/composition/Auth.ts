import { AuthService } from "@/application/services/AuthService"
import { SupabaseAuthRepository } from "@/infrastructure/auth/SupabaseAuthRepository"

const authRepository = new SupabaseAuthRepository()

export const authService = new AuthService(authRepository)
