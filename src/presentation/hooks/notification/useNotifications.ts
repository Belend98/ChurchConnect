import { notificationService } from '@/composition/notification'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { countUnreadNotifications, notificationsQueryKey } from '@/presentation/queries/notificationQueries'
import { useQuery } from '@tanstack/react-query'

export function useNotifications() {
  const userId = useCurrentUserId()
  const query = useQuery({
    queryKey: notificationsQueryKey(userId),
    queryFn: () => notificationService.listMyNotifications(),
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
  })
  return { ...query, userId, unreadCount: countUnreadNotifications(query.data ?? []) }
}
