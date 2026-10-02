import { CategorieService } from '@/application/services/CategorieService'
import { SupabaseCategorieRepository } from '@/infrastructure/categorie/SupabaseCategorieRepository'

const categorieRepository = new SupabaseCategorieRepository()

export const categorieService = new CategorieService(categorieRepository)
