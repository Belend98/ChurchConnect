import type {
  CreateMessageGroupeModel,
  MessageGroupeModel,
  UnsubscribeMessageGroupe,
} from '@/domain/entités/MessageGroupe'

export interface MessageGroupeRepository {
  create(data: CreateMessageGroupeModel): Promise<MessageGroupeModel>
  listByGroupe(groupeId: string): Promise<MessageGroupeModel[]>
  subscribeToNewMessages(
    groupeId: string,
    onMessage: (message: MessageGroupeModel) => void,
  ): UnsubscribeMessageGroupe
}
