import type {
  CreatePredicationModel,
  PredicationModel,
  UpdatePredicationModel,
} from '@/domain/entités/Predication'

export interface PredicationRepository {
  create(data: CreatePredicationModel): Promise<PredicationModel>
  getById(id: string): Promise<PredicationModel | null>
  list(): Promise<PredicationModel[]>
  update(id: string, data: UpdatePredicationModel): Promise<PredicationModel>
  delete(id: string): Promise<void>
}
