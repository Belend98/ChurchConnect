import type {
  CategorieModel,
  CreateCategorieModel,
} from '@/domain/entités/Categorie'
import type { CategorieRepository } from '@/domain/repositories/CategorieRepository'
import { cleanCategorieName, normalizeCategorieName } from '@/domain/rules/categorieRules'

export class CategorieService {
  constructor(private readonly categorieRepository: CategorieRepository) {}

  async createCategorie(data: CreateCategorieModel): Promise<CategorieModel> {
    const nom = await this.validateName(data.nom)
    return this.categorieRepository.create({ nom })
  }

  deleteCategorie(id: string): Promise<void> {
    return this.categorieRepository.delete(id)
  }

  listCategories(): Promise<CategorieModel[]> {
    return this.categorieRepository.list()
  }

  async updateCategorie(
    id: string,
    data: CreateCategorieModel,
  ): Promise<CategorieModel> {
    const nom = await this.validateName(data.nom, id)
    return this.categorieRepository.update(id, { nom })
  }

  private async validateName(name: string, excludedId?: string): Promise<string> {
    const nom = cleanCategorieName(name)
    const categories = await this.categorieRepository.list()
    if (categories.some((categorie) => categorie.id !== excludedId &&
      normalizeCategorieName(categorie.nom) === normalizeCategorieName(nom))) {
      throw new Error('Une catégorie porte déjà ce nom.')
    }
    return nom
  }
}
