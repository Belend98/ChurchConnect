export const NOTIFICATION_TYPES = [
  'annonce',
  'message_groupe',
  'groupe_invitation',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export interface NotificationModel {
  id: string
  userId: string
  type: NotificationType
  titre: string
  contenu: string
  referenceId?: string
  isRead: boolean
  createdAt: Date
}

export type UnsubscribeNotification = () => void
