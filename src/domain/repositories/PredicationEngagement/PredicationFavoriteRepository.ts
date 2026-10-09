import type { PredicationFavoriteModel } from '@/domain/entities/PredicationEngagement/PredicationFavorite'

export interface PredicationFavoriteRepository {
  exists(predicationId: string, userId: string): Promise<boolean>
  add(predicationId: string, userId: string): Promise<PredicationFavoriteModel>
  remove(predicationId: string, userId: string): Promise<void>
  listByUser(userId: string): Promise<PredicationFavoriteModel[]>
}
