import type {
  CreatePredicationModel,
  PredicationModel,
  UpdatePredicationModel,
} from '@/domain/entités/Predication'
import type { PredicationRepository } from '@/domain/repositories/PredicationRepository'
import { supabase } from '@/infrastructure/supabase/client'

type PredicationRow = {
  predication_id: string
  categorie_id: string | null
  title: string
  media_url: string
  duration_seconds: number | null
  created_at: string
}

const PREDICATION_SELECT =
  'predication_id, categorie_id, title, media_url, duration_seconds, created_at'

function mapPredication(row: PredicationRow): PredicationModel {
  return {
    id: row.predication_id,
    categorieId: row.categorie_id ?? undefined,
    title: row.title,
    mediaUrl: row.media_url,
    durationSeconds: row.duration_seconds ?? undefined,
    createdAt: new Date(row.created_at),
  }
}

export class SupabasePredicRepository implements PredicationRepository {
  async create(data: CreatePredicationModel): Promise<PredicationModel> {
    const { data: predication, error } = await supabase
      .from('predication')
      .insert({
        categorie_id: data.categorieId ?? null,
        title: data.title,
        media_url: data.mediaUrl,
        duration_seconds: data.durationSeconds ?? null,
      })
      .select(PREDICATION_SELECT)
      .single()

    if (error) throw error

    return mapPredication(predication as PredicationRow)
  }

  async list(): Promise<PredicationModel[]> {
    const { data, error } = await supabase
      .from('predication')
      .select(PREDICATION_SELECT)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as PredicationRow[]).map(mapPredication)
  }

  async update(
    id: string,
    data: UpdatePredicationModel,
  ): Promise<PredicationModel> {
    const { data: predication, error } = await supabase
      .from('predication')
      .update({
        categorie_id: data.categorieId ?? null,
        title: data.title,
        media_url: data.mediaUrl,
        duration_seconds: data.durationSeconds ?? null,
      })
      .eq('predication_id', id)
      .select(PREDICATION_SELECT)
      .maybeSingle()

    if (error) throw error
    if (!predication) {
      throw new Error(
        "Aucune prédication n'a été modifiée. Vérifie que la policy RLS update est appliquée et que l'identifiant existe.",
      )
    }

    return mapPredication(predication as PredicationRow)
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await supabase
      .from('predication')
      .delete()
      .eq('predication_id', id)
      .select('predication_id')
      .maybeSingle()

    if (error) throw error
    if (!data) {
      throw new Error(
        "Aucune prédication n'a été supprimée. Vérifie que la policy RLS delete est appliquée et que l'identifiant existe.",
      )
    }
  }
}
