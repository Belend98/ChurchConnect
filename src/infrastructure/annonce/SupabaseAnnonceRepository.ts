import type {
  AnnonceModel,
  CreateAnnonceModel,
  UpdateAnnonceModel,
} from '@/domain/entités/Annonce'
import type { AnnonceRepository } from '@/domain/repositories/AnnonceRepository'
import { supabase } from '@/infrastructure/supabase/client'

export type AnnonceRow = {
  annonce_id: string
  titre: string
  contenu: string
  created_by: string | null
  created_at: string
  updated_at: string | null
}

const ANNONCE_SELECT =
  'annonce_id, titre, contenu, created_by, created_at, updated_at'

export function mapAnnonce(row: AnnonceRow): AnnonceModel {
  return {
    id: row.annonce_id,
    titre: row.titre,
    contenu: row.contenu,
    createdBy: row.created_by ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

export class SupabaseAnnonceRepository implements AnnonceRepository {
  async create(data: CreateAnnonceModel): Promise<AnnonceModel> {
    const { data: annonce, error } = await supabase
      .from('annonce')
      .insert({
        titre: data.titre,
        contenu: data.contenu,
        created_by: data.createdBy,
      })
      .select(ANNONCE_SELECT)
      .single()

    if (error) throw error

    return mapAnnonce(annonce as AnnonceRow)
  }

  async getById(id: string): Promise<AnnonceModel | null> {
    const { data, error } = await supabase
      .from('annonce')
      .select(ANNONCE_SELECT)
      .eq('annonce_id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapAnnonce(data as AnnonceRow) : null
  }

  async update(id: string, data: UpdateAnnonceModel): Promise<AnnonceModel> {
    const { data: annonce, error } = await supabase
      .from('annonce')
      .update({
        titre: data.titre,
        contenu: data.contenu,
        updated_at: new Date().toISOString(),
      })
      .eq('annonce_id', id)
      .select(ANNONCE_SELECT)
      .single()

    if (error) throw error
    return mapAnnonce(annonce as AnnonceRow)
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await supabase
      .from('annonce')
      .delete()
      .eq('annonce_id', id)
      .select('annonce_id')
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Annonce introuvable ou suppression non autorisée.')
  }

  async list(): Promise<AnnonceModel[]> {
    const { data, error } = await supabase
      .from('annonce')
      .select(ANNONCE_SELECT)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as AnnonceRow[]).map(mapAnnonce)
  }
}
