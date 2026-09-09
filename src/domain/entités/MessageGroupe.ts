export interface MessageGroupeModel {
  id: string
  groupeId: string
  userId: string
  contenu: string
  createdAt: Date
  updatedAt?: Date
}

export type CreateMessageGroupeModel = Omit<
  MessageGroupeModel,
  'id' | 'createdAt' | 'updatedAt'
>

export type UnsubscribeMessageGroupe = () => void
