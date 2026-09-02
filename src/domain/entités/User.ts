
export interface UserModel {
  id: string
  username: string
  bio?: string
  createdAt: Date
}

export type CreateUserModel = Omit<UserModel, 'id' | 'createdAt'>
