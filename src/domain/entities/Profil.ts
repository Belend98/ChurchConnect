
export const APP_ROLES = ['pasteur', 'admin', 'membre'] 

export type AppRole = (typeof APP_ROLES)[number]

export const DEFAULT_APP_ROLE: AppRole = 'membre'

export function canManagePredications(roleApp?: AppRole): boolean {
  return roleApp === 'pasteur' || roleApp === 'admin'
}

export function getAppRoleLabel(roleApp?: AppRole): string {
  if (roleApp === 'pasteur') return 'Pasteur'
  if (roleApp === 'admin') return 'Administrateur'

  return 'Membre'
}

export type StatutAcces = 'en_attente' | 'accepte' | 'refuse'

export interface ProfilModel {
  id: string
  username?: string
  nom?: string
  prenom?: string
  bio?: string
  imageUrl?: string
  dateNaissance?: Date
  roleApp: AppRole
  statutAcces: StatutAcces
  createdAt: Date
}

export type CreateProfilModel = Omit<
  ProfilModel,
  'id' | 'createdAt' | 'roleApp' | 'statutAcces'
> & {
  roleApp?: AppRole
}
