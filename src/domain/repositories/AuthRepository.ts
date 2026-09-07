import type { AuthUser } from "../entités/AuthUser";

export interface AuthResult {
    user: AuthUser | null
    hasSession: boolean
}

export interface AuthRepository {
  signUp(email: string, password: string): Promise<AuthResult>
  signIn(email: string, password: string): Promise<AuthResult>
  signOut(): Promise<void>
  getCurrentUser(): Promise<AuthUser | null>
}