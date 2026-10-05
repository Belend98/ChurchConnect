import type {
  AnnonceModel,
  CreateAnnonceModel,
  UpdateAnnonceModel,
} from '@/domain/entités/Annonce'

export interface AnnonceRepository {
  create(data: CreateAnnonceModel): Promise<AnnonceModel>
  getById(id: string): Promise<AnnonceModel | null>
  update(id: string, data: UpdateAnnonceModel): Promise<AnnonceModel>
  delete(id: string): Promise<void>
  list(): Promise<AnnonceModel[]>
}
