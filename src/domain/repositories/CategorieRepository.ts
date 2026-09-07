import type {
  CategorieModel,
  CreateCategorieModel,
} from '@/domain/entités/Categorie'

export interface CategorieRepository {
  create(data: CreateCategorieModel): Promise<CategorieModel>
  delete(id: string): Promise<void>
  list(): Promise<CategorieModel[]>
  update(id: string, data: CreateCategorieModel): Promise<CategorieModel>
}
