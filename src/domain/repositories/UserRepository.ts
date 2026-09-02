import type { CreateUserModel } from "../entités/User"

export interface UserProfile {
  id: string
  username: string
  bio: string | null
  createdAt: Date | null
}

export interface UserRepository {
  createProfile(userId: string, data: CreateUserModel): Promise<void>
  getProfile(userId: string): Promise<UserProfile | null>
  updateProfile(userId: string, data: CreateUserModel): Promise<void>
  deleteAccountData(userId: string): Promise<void>
}
