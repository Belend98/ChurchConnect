import type {
  NotificationModel,
  UnsubscribeNotification,
} from '@/domain/entités/Notification'

export interface NotificationRepository {
  countUnread(userId: string): Promise<number>
  listByUser(userId: string): Promise<NotificationModel[]>
  markAllAsRead(userId: string): Promise<void>
  markAsRead(id: string, userId: string): Promise<void>
  subscribeToUserNotifications(
    userId: string,
    onNotification: (notification: NotificationModel) => void,
  ): UnsubscribeNotification
}
