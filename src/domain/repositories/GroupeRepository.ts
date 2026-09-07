import type {
  CreateGroupeModel,
  GroupeModel,
  UpdateGroupeModel,
} from '@/domain/entités/Groupe'

export interface GroupeRepository {
  create(data: CreateGroupeModel): Promise<GroupeModel>
  getById(id: string): Promise<GroupeModel | null>
  list(): Promise<GroupeModel[]>
  listByIds(ids: string[]): Promise<GroupeModel[]>
  update(id: string, data: UpdateGroupeModel): Promise<GroupeModel>
  delete(id: string): Promise<void>
}
