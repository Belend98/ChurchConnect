import type { PredicationLikeModel } from '@/domain/entités/PredicationEngagement/PredicationLike'
import type { PredicationLikeRepository } from '@/domain/repositories/PredicationEngagement/PredicationLikeRepository'
import { supabase } from '@/infrastructure/supabase/client'

type PredicationLikeRow = {
  id: string
  predication_id: string
  user_id: string
  created_at: string
}

const PREDICATION_LIKE_SELECT = 'id, predication_id, user_id, created_at'

function mapPredicationLike(row: PredicationLikeRow): PredicationLikeModel {
  return {
    id: row.id,
    predicationId: row.predication_id,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
  }
}

export class SupabasePredicationLikeRepository
  implements PredicationLikeRepository
{
  async exists(predicationId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('predication_likes')
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
  ): Promise<PredicationLikeModel> {
    const { data, error } = await supabase
      .from('predication_likes')
      .upsert(
        {
          predication_id: predicationId,
          user_id: userId,
        },
        {
          onConflict: 'predication_id,user_id',
        },
      )
      .select(PREDICATION_LIKE_SELECT)
      .single()

    if (error) throw error

    return mapPredicationLike(data as PredicationLikeRow)
  }

  async remove(predicationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('predication_likes')
      .delete()
      .eq('predication_id', predicationId)
      .eq('user_id', userId)

    if (error) throw error
  }

  async countByPredication(predicationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('predication_likes')
      .select('id', { count: 'exact', head: true })
      .eq('predication_id', predicationId)

    if (error) throw error

    return count ?? 0
  }
}
