import type { AuthService } from '@/application/AuthService'
import type { CreateProfilModel } from '@/domain/entités/Profil'
import type { ProfilRepository } from '@/domain/repositories/ProfilRepository'

export class ProfilService {
  constructor(
    private readonly profilRepository: ProfilRepository,
    private readonly authService: AuthService,
  ) {}

  createProfile(userId: string, data: CreateProfilModel) {
    return this.profilRepository.createProfile(userId, data)
  }

  getMyProfile(userId: string) {
    return this.profilRepository.getProfile(userId)
  }

  async getCurrentUserProfileOrThrow() {
    const user = await this.authService.getCurrentUserOrThrow()
    const profile = await this.profilRepository.getProfile(user.id)

    if (!profile) throw new Error('Profil introuvable.')

    return {
      ...profile,
      email: user.email,
    }
  }

  async updateCurrentUserProfile(data: CreateProfilModel) {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    await this.profilRepository.updateProfile(userId, data)
  }

  async deleteCurrentUserAccountData() {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    await this.profilRepository.deleteAccountData(userId)
  }
}
