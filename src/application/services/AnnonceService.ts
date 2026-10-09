import type { AuthService } from '@/application/services/AuthService'
import type {
  AnnonceModel,
  CreateAnnonceModel,
  UpdateAnnonceModel,
} from '@/domain/entities/Annonce'
import { canManagePredications } from '@/domain/entities/Profil'
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
    const userId = await this.requireManager()

    return this.annonceRepository.create({
      ...data,
      createdBy: userId,
    })
  }

  listAnnonces(): Promise<AnnonceModel[]> {
    return this.annonceRepository.list()
  }

  getAnnonce(id: string): Promise<AnnonceModel | null> {
    return this.annonceRepository.getById(id)
  }

  async updateAnnonce(id: string, data: UpdateAnnonceModel): Promise<AnnonceModel> {
    await this.requireManager()
    return this.annonceRepository.update(id, data)
  }

  async deleteAnnonce(id: string): Promise<void> {
    await this.requireManager()
    await this.annonceRepository.delete(id)
  }

  private async requireManager(): Promise<string> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const profile = await this.profilRepository.getProfile(userId)
    if (!profile) throw new Error('Profil introuvable.')
    if (profile.statutAcces !== 'accepte' || !canManagePredications(profile.roleApp)) {
      throw new Error('Seuls les pasteurs et administrateurs peuvent gérer les annonces.')
    }
    return userId
  }
}
