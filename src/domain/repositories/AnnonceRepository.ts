import type {
  AnnonceModel,
  CreateAnnonceModel,
} from '@/domain/entités/Annonce'

export interface AnnonceRepository {
  create(data: CreateAnnonceModel): Promise<AnnonceModel>
}
