import type { CreateProfilModel, ProfilModel } from '../entités/Profil'

export interface ProfilRepository {
  createProfile(userId: string, data: CreateProfilModel): Promise<ProfilModel>
  findByUsername(username: string): Promise<ProfilModel | null>
  getProfile(userId: string): Promise<ProfilModel | null>
  listCommunityMembers(limit?: number): Promise<ProfilModel[]>
  ensurePendingProfile(userId: string, nom: string, prenom?: string): Promise<ProfilModel>
  listAccessRequests(): Promise<ProfilModel[]>
  listRejectedMembers(): Promise<ProfilModel[]>
  decideAccess(userId: string, accepted: boolean): Promise<void>
  listByIds(ids: string[]): Promise<ProfilModel[]>
  updateProfile(userId: string, data: CreateProfilModel): Promise<ProfilModel>
}
