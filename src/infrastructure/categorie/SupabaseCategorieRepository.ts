import type {
  CategorieModel,
  CreateCategorieModel,
} from '@/domain/entités/Categorie'
import type { CategorieRepository } from '@/domain/repositories/CategorieRepository'
import { supabase } from '@/infrastructure/supabase/client'

type CategorieRow = {
  categorie_id: string
  name: string
}

const CATEGORIE_SELECT = 'categorie_id, name'

function mapCategorie(row: CategorieRow): CategorieModel {
  return {
    id: row.categorie_id,
    nom: row.name,
  }
}

export class SupabaseCategorieRepository implements CategorieRepository {
  async create(data: CreateCategorieModel): Promise<CategorieModel> {
    const { data: categorie, error } = await supabase
      .from('categorie_predication')
      .insert({
        name: data.nom,
      })
      .select(CATEGORIE_SELECT)
      .single()

    if (error) throw error

    return mapCategorie(categorie as CategorieRow)
  }

  async list(): Promise<CategorieModel[]> {
    const { data, error } = await supabase
      .from('categorie_predication')
      .select(CATEGORIE_SELECT)
      .order('name', { ascending: true })

    if (error) throw error

    return ((data ?? []) as CategorieRow[]).map(mapCategorie)
  }
}
