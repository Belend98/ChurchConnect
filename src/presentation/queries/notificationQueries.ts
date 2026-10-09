import type { NotificationModel } from '@/domain/entities/Notification'
import type { QueryClient } from '@tanstack/react-query'

export const notificationsQueryKey = (userId: string | null) =>
  ['notifications', userId] as const

type NotificationChange =
  | { type: 'upsert'; notification: NotificationModel }
  | { type: 'delete'; id: string }
  | { type: 'read'; notifications: NotificationModel[] }

export function countUnreadNotifications(notifications: NotificationModel[]) {
  return notifications.filter((item) => !item.isRead).length
}

export async function applyNotificationChange(
  queryClient: QueryClient,
  userId: string,
  change: NotificationChange,
) {
  if (change.type === 'upsert' && change.notification.userId !== userId) return
  const queryKey = notificationsQueryKey(userId)
  await queryClient.cancelQueries({ queryKey, exact: true })
  queryClient.setQueryData<NotificationModel[]>(queryKey, (current) => {
    if (!current) return undefined
    if (change.type === 'delete') return current.filter((item) => item.id !== change.id)
    if (change.type === 'read') {
      const ids = new Set(change.notifications.filter((item) => item.userId === userId).map((item) => item.id))
      return current.map((item) => ids.has(item.id) ? { ...item, isRead: true } : item)
    }
    return [
      ...current.filter((item) => item.id !== change.notification.id),
      change.notification,
    ].sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
  })
  if (!queryClient.getQueryData(queryKey)) {
    await queryClient.invalidateQueries({ queryKey, exact: true })
  }
}
