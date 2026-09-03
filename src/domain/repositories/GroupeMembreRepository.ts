import type {
  CreateGroupeMembreModel,
  GroupeMembreModel,
  UpdateGroupeMembreModel,
} from '@/domain/entités/GroupeMember'

export interface GroupeMembreRepository {
  create(data: CreateGroupeMembreModel): Promise<GroupeMembreModel>
  getById(id: string): Promise<GroupeMembreModel | null>
  listByGroupe(groupeId: string): Promise<GroupeMembreModel[]>
  listByUser(userId: string): Promise<GroupeMembreModel[]>
  update(id: string, data: UpdateGroupeMembreModel): Promise<GroupeMembreModel>
  delete(id: string): Promise<void>
  deleteByGroupeAndUser(groupeId: string, userId: string): Promise<void>
}
