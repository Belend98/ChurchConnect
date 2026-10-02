import { AnnonceService } from '@/application/services/AnnonceService'
import { authService } from '@/composition/Auth'
import { SupabaseAnnonceRepository } from '@/infrastructure/annonce/SupabaseAnnonceRepository'
import { SupabaseProfilRepository } from '@/infrastructure/profil/SupabaseProfilRepository'

const annonceRepository = new SupabaseAnnonceRepository()
const profilRepository = new SupabaseProfilRepository()

export const annonceService = new AnnonceService(
  annonceRepository,
  profilRepository,
  authService,
)
