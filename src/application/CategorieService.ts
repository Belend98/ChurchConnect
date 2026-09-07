import type {
  CategorieModel,
  CreateCategorieModel,
} from '@/domain/entités/Categorie'
import type { CategorieRepository } from '@/domain/repositories/CategorieRepository'

export class CategorieService {
  constructor(private readonly categorieRepository: CategorieRepository) {}

  createCategorie(data: CreateCategorieModel): Promise<CategorieModel> {
    return this.categorieRepository.create({
      nom: data.nom.trim(),
    })
  }

  deleteCategorie(id: string): Promise<void> {
    return this.categorieRepository.delete(id)
  }

  listCategories(): Promise<CategorieModel[]> {
    return this.categorieRepository.list()
  }

  updateCategorie(
    id: string,
    data: CreateCategorieModel,
  ): Promise<CategorieModel> {
    return this.categorieRepository.update(id, {
      nom: data.nom.trim(),
    })
  }
}
