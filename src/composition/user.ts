import { UserService } from '@/application/UserService'
import { authService } from './auth'
import { SupabaseUserRepository } from '@/infrastructure/user/SupabaseUserRepository'

const userRepository = new SupabaseUserRepository()

export const userService = new UserService(userRepository, authService)
