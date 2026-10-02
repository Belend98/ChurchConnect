import { GroupeService } from '@/application/services/GroupeService'
import { authService } from '@/composition/Auth'
import { SupabaseGroupeMembreRepository } from '@/infrastructure/groupe/SupabaseGroupeMembreRepository'
import { SupabaseGroupeRepository } from '@/infrastructure/groupe/SupabaseGroupeRepository'
import { SupabaseProfilRepository } from '@/infrastructure/profil/SupabaseProfilRepository'

const groupeRepository = new SupabaseGroupeRepository()
const groupeMembreRepository = new SupabaseGroupeMembreRepository()
const profilRepository = new SupabaseProfilRepository()

export const groupeService = new GroupeService(
  groupeRepository,
  groupeMembreRepository,
  profilRepository,
  authService,
)
