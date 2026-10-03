import type { AuthService } from '@/application/services/AuthService'
import type { ProfilRepository } from '@/domain/repositories/ProfilRepository'
import type { ManagedAppRole, RoleAdminGateway } from '@/domain/repositories/RoleAdminGateway'

export class ChangeUserRoleUseCase {
  constructor(
    private readonly profilRepository: ProfilRepository,
    private readonly authService: AuthService,
    private readonly roleAdminGateway: RoleAdminGateway,
  ) {}

  async execute(userId: string, role: ManagedAppRole): Promise<void> {
    if (role !== 'admin' && role !== 'membre') throw new Error('Rôle invalide.')
    const actorId = await this.authService.getCurrentUserIdOrThrow()
    const actor = await this.profilRepository.getProfile(actorId)
    if (actor?.roleApp !== 'pasteur' && actor?.roleApp !== 'admin') {
      throw new Error('Seuls les admins et les pasteurs peuvent modifier les rôles.')
    }
    const target = await this.profilRepository.getProfile(userId)
    if (!target) throw new Error('Membre introuvable.')
    if (target.roleApp === 'pasteur') throw new Error('Ce role ne peut pas être changé.')

    await this.roleAdminGateway.changeUserRole(userId, role)
  }
}
