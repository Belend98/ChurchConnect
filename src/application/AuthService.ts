import type { AuthRepository } from "@/domain/repositories/AuthRepository"

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  signUp(email: string, password: string) {
    return this.authRepository.signUp(email, password)
  }

  signIn(email: string, password: string) {
    return this.authRepository.signIn(email, password)
  }

  signOut() {
    return this.authRepository.signOut()
  }

  getCurrentUser() {
    return this.authRepository.getCurrentUser()
  }

  async getCurrentUserOrThrow() {
    const user = await this.getCurrentUser()

    if (!user) throw new Error('Utilisateur non connecté.')

    return user
  }

  async getCurrentUserIdOrThrow() {
    const user = await this.getCurrentUserOrThrow()
    return user.id
  }
}
