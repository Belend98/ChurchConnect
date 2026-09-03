export interface PredicationFavoriteModel {
  id: string
  predicationId: string
  userId: string
  createdAt: Date
}

export type CreatePredicationFavoriteModel = Omit<
  PredicationFavoriteModel,
  'id' | 'createdAt'
>