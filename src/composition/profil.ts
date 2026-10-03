import { ProfilService } from '@/application/services/ProfilService'
import { ChangeUserRoleUseCase } from '@/application/use cases/ChangeUserRoleUseCase'
import { DeleteAccountUseCase } from '@/application/use cases/DeleteAccountUseCase'
import { clearLocalAccountSession } from '@/infrastructure/auth/clearLocalAccountSession'
import { SupabaseAuthAdminGateway } from '@/infrastructure/auth/SupabaseAuthAdminGateway'
import { SupabaseProfilRepository } from '@/infrastructure/profil/SupabaseProfilRepository'
import { SupabaseRoleAdminGateway } from '@/infrastructure/profil/SupabaseRoleAdminGateway'
import { SupabaseImageStorage } from '@/infrastructure/storage/SupabaseImageStorage'
import { authService } from './Auth'

const profilRepository = new SupabaseProfilRepository()
const imageStorage = new SupabaseImageStorage()

export const changeUserRoleUseCase = new ChangeUserRoleUseCase(
  profilRepository,
  authService,
  new SupabaseRoleAdminGateway(),
)

export const deleteAccountUseCase = new DeleteAccountUseCase(
  new SupabaseAuthAdminGateway(),
  authService,
  async () => {
    await clearLocalAccountSession()
  },
)

export const profilService = new ProfilService(
  profilRepository,
  authService,
  imageStorage,
  deleteAccountUseCase,
)
