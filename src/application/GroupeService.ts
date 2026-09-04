import type { AuthService } from '@/application/AuthService'
import type {
  CreateGroupeModel,
  GroupeModel,
  UpdateGroupeModel,
} from '@/domain/entités/Groupe'
import type {
  CreateGroupeMembreModel,
  GroupeMembreModel,
  UpdateGroupeMembreModel,
} from '@/domain/entités/GroupeMember'
import type { GroupeMembreRepository } from '@/domain/repositories/GroupeMembreRepository'
import type { GroupeRepository } from '@/domain/repositories/GroupeRepository'

export class GroupeService {
  constructor(
    private readonly groupeRepository: GroupeRepository,
    private readonly groupeMembreRepository: GroupeMembreRepository,
    private readonly authService: AuthService,
  ) {}

  async createGroupe(data: Omit<CreateGroupeModel, 'createdBy'>): Promise<GroupeModel> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const groupe = await this.groupeRepository.create({
      ...data,
      createdBy: userId,
    })

    await this.groupeMembreRepository.create({
      groupeId: groupe.id,
      userId,
      isGroupAdmin: true,
    })

    return groupe
  }

  async getGroupe(id: string): Promise<GroupeModel | null> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const memberships = await this.groupeMembreRepository.listByUser(userId)
    const canSeeGroupe = memberships.some((membership) => membership.groupeId === id)

    if (!canSeeGroupe) return null

    return this.groupeRepository.getById(id)
  }

  async listGroupes(): Promise<GroupeModel[]> {
    return this.listMyGroupes()
  }

  async listMyGroupes(): Promise<GroupeModel[]> {
    const memberships = await this.listMyGroupesMemberships()
    const groupeIds = memberships.map((membership) => membership.groupeId)

    return this.groupeRepository.listByIds(groupeIds)
  }

  async updateGroupe(id: string, data: UpdateGroupeModel): Promise<GroupeModel> {
    await this.ensureCurrentUserIsGroupAdmin(id)

    return this.groupeRepository.update(id, data)
  }

  async deleteGroupe(id: string): Promise<void> {
    await this.ensureCurrentUserIsGroupAdmin(id)

    return this.groupeRepository.delete(id)
  }

  async addMembre(data: CreateGroupeMembreModel): Promise<GroupeMembreModel> {
    await this.ensureCurrentUserIsGroupAdmin(data.groupeId)

    return this.groupeMembreRepository.create(data)
  }

  async joinGroupe(_groupeId: string): Promise<GroupeMembreModel> {
    throw new Error(
      "Rejoindre un groupe directement n'est pas disponible sans invitation.",
    )
  }

  getMembre(id: string): Promise<GroupeMembreModel | null> {
    return this.groupeMembreRepository.getById(id)
  }

  async listMembres(groupeId: string): Promise<GroupeMembreModel[]> {
    await this.ensureCurrentUserIsGroupMember(groupeId)

    return this.groupeMembreRepository.listByGroupe(groupeId)
  }

  async listMyGroupesMemberships(): Promise<GroupeMembreModel[]> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    return this.groupeMembreRepository.listByUser(userId)
  }

  async updateMembre(
    id: string,
    data: UpdateGroupeMembreModel,
  ): Promise<GroupeMembreModel> {
    const membership = await this.groupeMembreRepository.getById(id)

    if (!membership) throw new Error('Membre introuvable.')

    await this.ensureCurrentUserIsGroupAdmin(membership.groupeId)

    return this.groupeMembreRepository.update(id, data)
  }

  async removeMembre(id: string): Promise<void> {
    const membership = await this.groupeMembreRepository.getById(id)

    if (!membership) return

    const currentUserId = await this.authService.getCurrentUserIdOrThrow()

    if (currentUserId !== membership.userId) {
      await this.ensureCurrentUserIsGroupAdmin(membership.groupeId)
    }

    return this.groupeMembreRepository.delete(id)
  }

  async removeMembreFromGroupe(groupeId: string, userId: string): Promise<void> {
    const currentUserId = await this.authService.getCurrentUserIdOrThrow()

    if (currentUserId !== userId) {
      await this.ensureCurrentUserIsGroupAdmin(groupeId)
    }

    return this.groupeMembreRepository.deleteByGroupeAndUser(groupeId, userId)
  }

  private async ensureCurrentUserIsGroupMember(groupeId: string): Promise<void> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const memberships = await this.groupeMembreRepository.listByUser(userId)
    const isMember = memberships.some((membership) => membership.groupeId === groupeId)

    if (!isMember) throw new Error("Vous n'êtes pas membre de ce groupe.")
  }

  private async ensureCurrentUserIsGroupAdmin(groupeId: string): Promise<void> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const memberships = await this.groupeMembreRepository.listByUser(userId)
    const isAdmin = memberships.some(
      (membership) =>
        membership.groupeId === groupeId && membership.isGroupAdmin,
    )

    if (!isAdmin) throw new Error("Vous n'êtes pas administrateur de ce groupe.")
  }
}
