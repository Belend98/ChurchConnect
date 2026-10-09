export interface MessageGroupeModel {
  id: string
  groupeId: string
  userId: string | null
  contenu: string
  createdAt: Date
  updatedAt?: Date
}

export type CreateMessageGroupeModel = Omit<
  MessageGroupeModel,
  'id' | 'createdAt' | 'updatedAt' | 'userId'
> & { userId: string; id?: string }

export type UnsubscribeMessageGroupe = () => void
