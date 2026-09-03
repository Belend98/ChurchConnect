import type { CreateProfilModel, ProfilModel } from '../entités/User'

export interface UserRepository {
  createProfile(userId: string, data: CreateProfilModel): Promise<void>
  getProfile(userId: string): Promise<ProfilModel | null>
  updateProfile(userId: string, data: CreateProfilModel): Promise<void>
  deleteAccountData(userId: string): Promise<void>
}
