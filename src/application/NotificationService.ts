import type { AuthService } from '@/application/AuthService'
import type {
  NotificationModel,
  UnsubscribeNotification,
} from '@/domain/entités/Notification'
import type { NotificationRepository } from '@/domain/repositories/NotificationRepository'

export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly authService: AuthService,
  ) {}

  async countUnreadForCurrentUser(): Promise<number> {
    const userId = await this.authService.getCurrentUserIdOrThrow()

    return this.notificationRepository.countUnread(userId)
  }

  async listMyNotifications(): Promise<NotificationModel[]> {
    const userId = await this.authService.getCurrentUserIdOrThrow()

    return this.notificationRepository.listByUser(userId)
  }

  async markAllMyNotificationsAsRead(): Promise<void> {
    const userId = await this.authService.getCurrentUserIdOrThrow()

    await this.notificationRepository.markAllAsRead(userId)
  }

  async markMyNotificationAsRead(id: string): Promise<void> {
    const userId = await this.authService.getCurrentUserIdOrThrow()

    await this.notificationRepository.markAsRead(id, userId)
  }

  async subscribeToMyNotifications(
    onNotification: (notification: NotificationModel) => void,
  ): Promise<UnsubscribeNotification> {
    const userId = await this.authService.getCurrentUserIdOrThrow()

    return this.notificationRepository.subscribeToUserNotifications(
      userId,
      onNotification,
    )
  }
}
