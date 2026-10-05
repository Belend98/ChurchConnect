import type {
  NotificationModel,
  UnsubscribeNotification,
} from '@/domain/entités/Notification'

export interface NotificationRepository {
  countUnread(userId: string): Promise<number>
  listByUser(userId: string): Promise<NotificationModel[]>
  markAllAsRead(userId: string): Promise<NotificationModel[]>
  markAsRead(id: string, userId: string): Promise<NotificationModel | null>
  deleteById(id: string, userId: string): Promise<void>
  deleteByUser(userId: string): Promise<void>
  subscribeToUserNotifications(
    userId: string,
    onNotification: (notification: NotificationModel) => void,
  ): UnsubscribeNotification
}
