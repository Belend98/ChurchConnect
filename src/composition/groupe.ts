import { GroupeService } from '@/application/GroupeService'
import { authService } from '@/composition/auth'
import { SupabaseGroupeMembreRepository } from '@/infrastructure/groupe/SupabaseGroupeMembreRepository'
import { SupabaseGroupeRepository } from '@/infrastructure/groupe/SupabaseGroupeRepository'

const groupeRepository = new SupabaseGroupeRepository()
const groupeMembreRepository = new SupabaseGroupeMembreRepository()

export const groupeService = new GroupeService(
  groupeRepository,
  groupeMembreRepository,
  authService,
)
