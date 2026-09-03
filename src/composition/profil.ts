import { ProfilService } from '@/application/ProfilService'
import { authService } from './auth'
import { SupabaseProfilRepository } from '@/infrastructure/profil/SupabaseProfilRepository'

const profilRepository = new SupabaseProfilRepository()

export const profilService = new ProfilService(profilRepository, authService)
