export interface PredicationLikeModel {
  id: string
  predicationId: string
  userId: string
  createdAt: Date
}

export type CreatePredicationLikeModel = Omit<
  PredicationLikeModel,
  'id' | 'createdAt'
>