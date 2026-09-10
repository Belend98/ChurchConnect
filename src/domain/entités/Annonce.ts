export interface AnnonceModel {
  id: string
  titre: string
  contenu: string
  imageUrl?: string
  createdBy?: string
  createdAt: Date
  updatedAt?: Date
}

export type CreateAnnonceModel = Omit<
  AnnonceModel,
  'id' | 'createdAt' | 'updatedAt'
>
