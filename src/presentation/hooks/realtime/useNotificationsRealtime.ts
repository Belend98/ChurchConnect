import { mapNotification, type NotificationRow } from '@/infrastructure/notification/SupabaseNotificationRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { applyNotificationChange, notificationsQueryKey } from '@/presentation/queries/notificationQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useNotificationsRealtime() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  useEffect(() => {
    if (!userId) return
    let active = true
    const queryKey = notificationsQueryKey(userId)
    const syncRow = (row: NotificationRow) => {
      if (active) void applyNotificationChange(queryClient, userId, {
        type: 'upsert', notification: mapNotification(row),
      })
    }
    const channel = supabase.channel(`notifications-cache-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notification', filter: `user_id=eq.${userId}`,
      }, (payload) => syncRow(payload.new as NotificationRow))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notification', filter: `user_id=eq.${userId}`,
      }, (payload) => syncRow(payload.new as NotificationRow))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'notification',
      }, (payload) => {
        const id = payload.old.notification_id as string | undefined
        if (active && id) void applyNotificationChange(queryClient, userId, { type: 'delete', id })
      })
      .subscribe((status) => {
        if (active && status === 'SUBSCRIBED') {
          void queryClient.invalidateQueries({ queryKey, exact: true })
        }
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
      void queryClient.cancelQueries({ queryKey, exact: true })
      queryClient.removeQueries({ queryKey, exact: true })
    }
  }, [queryClient, userId])
}
