import type {
  CreatePredicationModel,
  PredicationModel,
} from '@/domain/entités/Predication'

export interface PredicationRepository {
  create(data: CreatePredicationModel): Promise<PredicationModel>
  list(): Promise<PredicationModel[]>
  delete(id: string): Promise<void>
}
