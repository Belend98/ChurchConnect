import type { PredicationLikeModel } from '@/domain/entités/PredicationEngagement/PredicationLike'

export interface PredicationLikeRepository {
  exists(predicationId: string, userId: string): Promise<boolean>
  add(predicationId: string, userId: string): Promise<PredicationLikeModel>
  remove(predicationId: string, userId: string): Promise<void>
  countByPredication(predicationId: string): Promise<number>
}
