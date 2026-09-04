export interface CategorieModel {
  id: string
  nom: string
}

export type CreateCategorieModel = Omit<CategorieModel, 'id'>
