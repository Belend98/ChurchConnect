import type {
  AnnonceModel,
  CreateAnnonceModel,
} from '@/domain/entités/Annonce'
import type { AnnonceRepository } from '@/domain/repositories/AnnonceRepository'
import { supabase } from '@/infrastructure/supabase/client'

type AnnonceRow = {
  annonce_id: string
  titre: string
  contenu: string
  image_url: string | null
  created_by: string
  created_at: string
  updated_at: string | null
}

const ANNONCE_SELECT =
  'annonce_id, titre, contenu, image_url, created_by, created_at, updated_at'

function mapAnnonce(row: AnnonceRow): AnnonceModel {
  return {
    id: row.annonce_id,
    titre: row.titre,
    contenu: row.contenu,
    imageUrl: row.image_url ?? undefined,
    createdBy: row.created_by,
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
        image_url: data.imageUrl ?? null,
        created_by: data.createdBy,
      })
      .select(ANNONCE_SELECT)
      .single()

    if (error) throw error

    return mapAnnonce(annonce as AnnonceRow)
  }
}
