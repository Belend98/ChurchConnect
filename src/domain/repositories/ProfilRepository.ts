import type { CreateProfilModel, ProfilModel } from '../entités/Profil'

export interface ProfilRepository {
  createProfile(userId: string, data: CreateProfilModel): Promise<void>
  findByUsername(username: string): Promise<ProfilModel | null>
  getProfile(userId: string): Promise<ProfilModel | null>
  listByIds(ids: string[]): Promise<ProfilModel[]>
  updateProfile(userId: string, data: CreateProfilModel): Promise<void>
  deleteAccountData(userId: string): Promise<void>
}
