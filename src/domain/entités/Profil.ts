
export interface ProfilModel {
  id: string
  username?: string
  nom?: string
  prenom?: string
  bio?: string
  dateNaissance?: Date
  isAdmin: boolean
  createdAt: Date
}

export type CreateProfilModel = Omit<
  ProfilModel,
  'id' | 'createdAt' | 'isAdmin'
> & {
  isAdmin?: boolean
}
