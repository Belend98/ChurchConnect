import { ProfilService } from '@/application/ProfilService'
import { authService } from './Auth'
import { SupabaseProfilRepository } from '@/infrastructure/profil/SupabaseProfilRepository'
import { SupabaseImageStorage } from '@/infrastructure/storage/SupabaseImageStorage'

const profilRepository = new SupabaseProfilRepository()
const imageStorage = new SupabaseImageStorage()

export const profilService = new ProfilService(
  profilRepository,
  authService,
  imageStorage,
)
