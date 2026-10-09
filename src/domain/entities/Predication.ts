export interface PredicationModel {
  id: string
  categorieId?: string
  title: string
  mediaUrl: string
  durationSeconds?: number
  createdAt: Date
}

export type CreatePredicationModel = Omit<PredicationModel, 'id' | 'createdAt'>
export type UpdatePredicationModel = CreatePredicationModel
