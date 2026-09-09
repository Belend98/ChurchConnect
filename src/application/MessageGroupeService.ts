import type { AuthService } from '@/application/AuthService'
import { canManageGroup } from '@/domain/entités/Groupe'
import type {
  MessageGroupeModel,
  UnsubscribeMessageGroupe,
} from '@/domain/entités/MessageGroupe'
import type { GroupeMembreRepository } from '@/domain/repositories/GroupeMembreRepository'
import type { GroupeRepository } from '@/domain/repositories/GroupeRepository'
import type { MessageGroupeRepository } from '@/domain/repositories/MessageGroupeRepository'

export class MessageGroupeService {
  constructor(
    private readonly messageGroupeRepository: MessageGroupeRepository,
    private readonly groupeRepository: GroupeRepository,
    private readonly groupeMembreRepository: GroupeMembreRepository,
    private readonly authService: AuthService,
  ) {}

  async listMessages(groupeId: string): Promise<MessageGroupeModel[]> {
    await this.ensureCurrentUserIsGroupMember(groupeId)

    return this.messageGroupeRepository.listByGroupe(groupeId)
  }

  async createMessage(
    groupeId: string,
    contenu: string,
  ): Promise<MessageGroupeModel> {
    const userId = await this.ensureCurrentUserCanWriteInGroup(groupeId)

    return this.messageGroupeRepository.create({
      groupeId,
      userId,
      contenu,
    })
  }

  subscribeToNewMessages(
    groupeId: string,
    onMessage: (message: MessageGroupeModel) => void,
  ): UnsubscribeMessageGroupe {
    return this.messageGroupeRepository.subscribeToNewMessages(
      groupeId,
      onMessage,
    )
  }

  private async ensureCurrentUserIsGroupMember(groupeId: string): Promise<void> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const memberships = await this.groupeMembreRepository.listByUser(userId)
    const isMember = memberships.some(
      (membership) => membership.groupeId === groupeId,
    )

    if (!isMember) throw new Error("Vous n'êtes pas membre de ce groupe.")
  }

  private async ensureCurrentUserCanWriteInGroup(
    groupeId: string,
  ): Promise<string> {
    const userId = await this.authService.getCurrentUserIdOrThrow()
    const groupe = await this.groupeRepository.getById(groupeId)
    const memberships = await this.groupeMembreRepository.listByUser(userId)
    const membership = memberships.find(
      (item) => item.groupeId === groupeId,
    )

    if (!groupe) throw new Error('Groupe introuvable.')
    if (!canManageGroup(groupe, membership, userId)) {
      throw new Error(
        'Seuls les créateurs et administrateurs peuvent écrire dans ce groupe.',
      )
    }

    return userId
  }
}
