import type { AuthService } from '@/application/AuthService'
import type { CreateProfilModel } from '@/domain/entités/User'
import type { UserRepository } from '@/domain/repositories/UserRepository'
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
  ) {}

  createProfile(userId: string, data: CreateProfilModel) {
    return this.userRepository.createProfile(userId, data)
  }

  getMyProfile(userId: string) {
    return this.userRepository.getProfile(userId)
  }

  async getCurrentUserProfileOrThrow() {
    const user = await this.authService.getCurrentUserOrThrow()
    const profile = await this.userRepository.getProfile(user.id)

    if (!profile) throw new Error('Profil introuvable.')

    return {
      ...profile,
      email: user.email,
    }
  }

  async updateCurrentUserProfile(data: CreateProfilModel) {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    await this.userRepository.updateProfile(userId, data)
  }

  async deleteCurrentUserAccountData() {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    await this.userRepository.deleteAccountData(userId)
  }
}
