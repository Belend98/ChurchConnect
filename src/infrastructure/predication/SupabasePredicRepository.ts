import type {
  CreatePredicationModel,
  PredicationModel,
} from '@/domain/entités/Predication'
import type { PredicationRepository } from '@/domain/repositories/PredicationRepository'
import { supabase } from '@/infrastructure/supabase/client'

type PredicationRow = {
  id: string
  categorie_id: string | null
  title: string
  media_url: string
  duration_seconds: number | null
  created_at: string
}

function mapPredication(row: PredicationRow): PredicationModel {
  return {
    id: row.id,
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
      .from('predications')
      .insert({
        categorie_id: data.categorieId ?? null,
        title: data.title,
        media_url: data.mediaUrl,
        duration_seconds: data.durationSeconds ?? null,
      })
      .select('id, categorie_id, title, media_url, duration_seconds, created_at')
      .single()

    if (error) throw error

    return mapPredication(predication as PredicationRow)
  }

  async list(): Promise<PredicationModel[]> {
    const { data, error } = await supabase
      .from('predications')
      .select('id, categorie_id, title, media_url, duration_seconds, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as PredicationRow[]).map(mapPredication)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('predications').delete().eq('id', id)

    if (error) throw error
  }
}
