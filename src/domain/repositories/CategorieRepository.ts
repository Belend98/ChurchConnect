import type {
  CategorieModel,
  CreateCategorieModel,
} from '@/domain/entités/Categorie'

export interface CategorieRepository {
  create(data: CreateCategorieModel): Promise<CategorieModel>
  list(): Promise<CategorieModel[]>
}
