import { NotificationService } from '@/application/services/NotificationService'
import { authService } from '@/composition/Auth'
import { SupabaseNotificationRepository } from '@/infrastructure/notification/SupabaseNotificationRepository'

const notificationRepository = new SupabaseNotificationRepository()

export const notificationService = new NotificationService(
  notificationRepository,
  authService,
)
