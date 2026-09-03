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

  getGroupe(id: string): Promise<GroupeModel | null> {
    return this.groupeRepository.getById(id)
  }

  listGroupes(): Promise<GroupeModel[]> {
    return this.groupeRepository.list()
  }

  updateGroupe(id: string, data: UpdateGroupeModel): Promise<GroupeModel> {
    return this.groupeRepository.update(id, data)
  }

  deleteGroupe(id: string): Promise<void> {
    return this.groupeRepository.delete(id)
  }

  addMembre(data: CreateGroupeMembreModel): Promise<GroupeMembreModel> {
    return this.groupeMembreRepository.create(data)
  }

  async joinGroupe(groupeId: string): Promise<GroupeMembreModel> {
    const userId = await this.authService.getCurrentUserIdOrThrow()

    return this.groupeMembreRepository.create({
      groupeId,
      userId,
      isGroupAdmin: false,
    })
  }

  getMembre(id: string): Promise<GroupeMembreModel | null> {
    return this.groupeMembreRepository.getById(id)
  }

  listMembres(groupeId: string): Promise<GroupeMembreModel[]> {
    return this.groupeMembreRepository.listByGroupe(groupeId)
  }

  async listMyGroupesMemberships(): Promise<GroupeMembreModel[]> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    return this.groupeMembreRepository.listByUser(userId)
  }

  updateMembre(
    id: string,
    data: UpdateGroupeMembreModel,
  ): Promise<GroupeMembreModel> {
    return this.groupeMembreRepository.update(id, data)
  }

  removeMembre(id: string): Promise<void> {
    return this.groupeMembreRepository.delete(id)
  }

  removeMembreFromGroupe(groupeId: string, userId: string): Promise<void> {
    return this.groupeMembreRepository.deleteByGroupeAndUser(groupeId, userId)
  }
}
