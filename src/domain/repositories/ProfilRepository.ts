import type { CreateProfilModel, ProfilModel } from '../entités/Profil'

export interface ProfilRepository {
  createProfile(userId: string, data: CreateProfilModel): Promise<ProfilModel>
  findByUsername(username: string): Promise<ProfilModel | null>
  getProfile(userId: string): Promise<ProfilModel | null>
  listCommunityMembers(limit?: number): Promise<ProfilModel[]>
  listByIds(ids: string[]): Promise<ProfilModel[]>
  updateProfile(userId: string, data: CreateProfilModel): Promise<ProfilModel>
  deleteAccountData(userId: string): Promise<void>
}
