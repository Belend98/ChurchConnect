import { MessageGroupeService } from '@/application/MessageGroupeService'
import { authService } from '@/composition/Auth'
import { SupabaseGroupeMembreRepository } from '@/infrastructure/groupe/SupabaseGroupeMembreRepository'
import { SupabaseGroupeRepository } from '@/infrastructure/groupe/SupabaseGroupeRepository'
import { SupabaseMessageGroupeRepository } from '@/infrastructure/groupe/SupabaseMessageGroupeRepository'

const messageGroupeRepository = new SupabaseMessageGroupeRepository()
const groupeRepository = new SupabaseGroupeRepository()
const groupeMembreRepository = new SupabaseGroupeMembreRepository()

export const messageGroupeService = new MessageGroupeService(
  messageGroupeRepository,
  groupeRepository,
  groupeMembreRepository,
  authService,
)
