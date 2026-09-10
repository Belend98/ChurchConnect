import type { AuthService } from '@/application/AuthService'
import { canManagePredications } from '@/domain/entités/Profil'
import type {
  AnnonceModel,
  CreateAnnonceModel,
} from '@/domain/entités/Annonce'
import type { AnnonceRepository } from '@/domain/repositories/AnnonceRepository'
import type { ProfilRepository } from '@/domain/repositories/ProfilRepository'

export class AnnonceService {
  constructor(
    private readonly annonceRepository: AnnonceRepository,
    private readonly profilRepository: ProfilRepository,
    private readonly authService: AuthService,
  ) {}

  async createAnnonce(
    data: Omit<CreateAnnonceModel, 'createdBy'>,
  ): Promise<AnnonceModel> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const profile = await this.profilRepository.getProfile(userId)

    if (!profile) throw new Error('Profil introuvable.')
    if (!canManagePredications(profile.roleApp)) {
      throw new Error('Seuls les pasteurs et administrateurs peuvent créer une annonce.')
    }

    return this.annonceRepository.create({
      ...data,
      createdBy: userId,
    })
  }

  listAnnonces(): Promise<AnnonceModel[]> {
    return this.annonceRepository.list()
  }
}
