import type {
  NotificationModel,
  NotificationType,
  UnsubscribeNotification,
} from '@/domain/entités/Notification'
import type { NotificationRepository } from '@/domain/repositories/NotificationRepository'
import { supabase } from '@/infrastructure/supabase/client'

type NotificationRow = {
  notification_id: string
  user_id: string
  type: string
  titre: string
  contenu: string
  reference_id: string | null
  is_read: boolean
  created_at: string
}

const NOTIFICATION_SELECT =
  'notification_id, user_id, type, titre, contenu, reference_id, is_read, created_at'

function mapNotification(row: NotificationRow): NotificationModel {
  return {
    id: row.notification_id,
    userId: row.user_id,
    type: row.type as NotificationType,
    titre: row.titre,
    contenu: row.contenu,
    referenceId: row.reference_id ?? undefined,
    isRead: row.is_read,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseNotificationRepository
  implements NotificationRepository
{
  async countUnread(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notification')
      .select('notification_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error

    return count ?? 0
  }

  async listByUser(userId: string): Promise<NotificationModel[]> {
    const { data, error } = await supabase
      .from('notification')
      .select(NOTIFICATION_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as NotificationRow[]).map(mapNotification)
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notification')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('notification')
      .update({ is_read: true })
      .eq('notification_id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  subscribeToUserNotifications(
    userId: string,
    onNotification: (notification: NotificationModel) => void,
  ): UnsubscribeNotification {
    const channel = supabase
      .channel(`notification-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          filter: `user_id=eq.${userId}`,
          schema: 'public',
          table: 'notification',
        },
        (payload) => {
          onNotification(mapNotification(payload.new as NotificationRow))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }
}
