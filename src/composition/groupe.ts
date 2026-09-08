import { GroupeService } from '@/application/GroupeService'
import { authService } from '@/composition/Auth'
import { SupabaseProfilRepository } from '@/infrastructure/profil/SupabaseProfilRepository'
import { SupabaseGroupeMembreRepository } from '@/infrastructure/groupe/SupabaseGroupeMembreRepository'
import { SupabaseGroupeRepository } from '@/infrastructure/groupe/SupabaseGroupeRepository'

const groupeRepository = new SupabaseGroupeRepository()
const groupeMembreRepository = new SupabaseGroupeMembreRepository()
const profilRepository = new SupabaseProfilRepository()

export const groupeService = new GroupeService(
  groupeRepository,
  groupeMembreRepository,
  profilRepository,
  authService,
)
