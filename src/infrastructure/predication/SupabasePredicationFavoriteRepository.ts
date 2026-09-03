import type { PredicationFavoriteModel } from '@/domain/entités/PredicationEngagement/PredicationFavorite'
import type { PredicationFavoriteRepository } from '@/domain/repositories/PredicationEngagement/PredicationFavoriteRepository'
import { supabase } from '@/infrastructure/supabase/client'

type PredicationFavoriteRow = {
  id: string
  predication_id: string
  user_id: string
  created_at: string
}

const PREDICATION_FAVORITE_SELECT = 'id, predication_id, user_id, created_at'

function mapPredicationFavorite(
  row: PredicationFavoriteRow,
): PredicationFavoriteModel {
  return {
    id: row.id,
    predicationId: row.predication_id,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
  }
}

export class SupabasePredicationFavoriteRepository
  implements PredicationFavoriteRepository
{
  async exists(predicationId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('predication_favorites')
      .select('id')
      .eq('predication_id', predicationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error

    return Boolean(data)
  }

  async add(
    predicationId: string,
    userId: string,
  ): Promise<PredicationFavoriteModel> {
    const { data, error } = await supabase
      .from('predication_favorites')
      .upsert(
        {
          predication_id: predicationId,
          user_id: userId,
        },
        {
          onConflict: 'predication_id,user_id',
        },
      )
      .select(PREDICATION_FAVORITE_SELECT)
      .single()

    if (error) throw error

    return mapPredicationFavorite(data as PredicationFavoriteRow)
  }

  async remove(predicationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('predication_favorites')
      .delete()
      .eq('predication_id', predicationId)
      .eq('user_id', userId)

    if (error) throw error
  }

  async listByUser(userId: string): Promise<PredicationFavoriteModel[]> {
    const { data, error } = await supabase
      .from('predication_favorites')
      .select(PREDICATION_FAVORITE_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as PredicationFavoriteRow[]).map(
      mapPredicationFavorite,
    )
  }
}
