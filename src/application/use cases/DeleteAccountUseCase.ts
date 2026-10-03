import type { AuthService } from '@/application/services/AuthService'
import type { AuthAdminGateway } from '@/domain/repositories/AuthAdminGateway'

export class DeleteAccountUseCase {
  constructor(
    private readonly authAdminGateway: AuthAdminGateway,
    private readonly authService: AuthService,
    private readonly clearLocalAccount: () => Promise<void>,
  ) {}

  async execute(targetUserId?: string): Promise<void> {
    const actorId = await this.authService.getCurrentUserIdOrThrow()
    const userId = targetUserId ?? actorId
    await this.authAdminGateway.deleteUser(userId)
    if (userId === actorId) await this.clearLocalAccount()
  }
}
 