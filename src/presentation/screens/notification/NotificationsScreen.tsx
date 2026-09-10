import { notificationService } from '@/composition/notification'
import type { NotificationModel } from '@/domain/entités/Notification'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

function appendNotificationUnique(
  items: NotificationModel[],
  notification: NotificationModel,
) {
  if (items.some((item) => item.id === notification.id)) return items

  return [notification, ...items].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
  )
}

function formatNotificationDate(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
}

function getTypeLabel(notification: NotificationModel) {
  if (notification.type === 'annonce') return 'Annonce'
  if (notification.type === 'message_groupe') return 'Groupe'

  return 'Invitation'
}

export default function NotificationsScreen() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false)
  const [notifications, setNotifications] = useState<NotificationModel[]>([])

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length

  const loadNotifications = useCallback(async () => {
    setError(null)
    setIsLoading(true)

    try {
      const notificationItems =
        await notificationService.listMyNotifications()
      setNotifications(notificationItems)
    } catch (loadError) {
      console.warn(loadError)
      setNotifications([])
      setError(
        toErrorMessage(loadError, 'Impossible de charger les notifications.'),
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      let unsubscribe: (() => void) | undefined

      loadNotifications()

      notificationService
        .subscribeToMyNotifications((notification) => {
          if (!isMounted) return
          setNotifications((currentNotifications) =>
            appendNotificationUnique(currentNotifications, notification),
          )
        })
        .then((unsubscribeNotification) => {
          unsubscribe = unsubscribeNotification
        })
        .catch((subscribeError) => {
          console.warn(subscribeError)
        })

      return () => {
        isMounted = false
        unsubscribe?.()
      }
    }, [loadNotifications]),
  )

  async function markAllAsRead() {
    setIsMarkingAllAsRead(true)
    setError(null)

    try {
      await notificationService.markAllMyNotificationsAsRead()
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      )
    } catch (markError) {
      setError(
        toErrorMessage(markError, 'Impossible de marquer les notifications.'),
      )
    } finally {
      setIsMarkingAllAsRead(false)
    }
  }

  async function openNotification(notification: NotificationModel) {
    if (!notification.isRead) {
      setNotifications((currentNotifications) =>
        currentNotifications.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      )

      try {
        await notificationService.markMyNotificationAsRead(notification.id)
      } catch (markError) {
        console.warn(markError)
      }
    }

    if (
      notification.referenceId &&
      (notification.type === 'message_groupe' ||
        notification.type === 'groupe_invitation')
    ) {
      router.push({
        pathname: '/groupe-detail',
        params: {
          id: notification.referenceId,
          name: notification.titre,
        },
      } as never)
      return
    }

    if (notification.type === 'annonce') {
      router.push('/(tabs)/home' as never)
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} non lue(s)`
              : 'Tout est à jour'}
          </Text>
        </View>

        <Pressable
          disabled={isMarkingAllAsRead || unreadCount === 0}
          onPress={markAllAsRead}
          style={[
            styles.markAllButton,
            (isMarkingAllAsRead || unreadCount === 0) &&
              styles.disabledButton,
          ]}
        >
          <Text style={styles.markAllButtonText}>
            {isMarkingAllAsRead ? 'Lecture...' : 'Tout lire'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Text style={styles.metaText}>Chargement des notifications...</Text>
        ) : null}

        {!isLoading && notifications.length === 0 ? (
          <Text style={styles.metaText}>
            Aucune notification pour le moment.
          </Text>
        ) : null}

        {notifications.map((notification) => (
          <Pressable
            key={notification.id}
            onPress={() => openNotification(notification)}
            style={[
              styles.notificationItem,
              !notification.isRead && styles.unreadNotificationItem,
            ]}
          >
            <View style={styles.notificationTopLine}>
              <Text style={styles.notificationType}>
                {getTypeLabel(notification)}
              </Text>
              <Text style={styles.notificationDate}>
                {formatNotificationDate(notification.createdAt)}
              </Text>
            </View>

            <Text style={styles.notificationTitle}>{notification.titre}</Text>
            <Text numberOfLines={2} style={styles.notificationContent}>
              {notification.contenu}
            </Text>
          </Pressable>
        ))}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomColor: colors.surfaceContainerHigh,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 20,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 28,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 34,
    lineHeight: 36,
  },
  title: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  markAllButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  markAllButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  content: {
    alignSelf: 'center',
    gap: 10,
    maxWidth: 520,
    padding: 16,
    paddingBottom: 96,
    width: '100%',
  },
  metaText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  notificationItem: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    padding: 14,
  },
  unreadNotificationItem: {
    borderColor: colors.secondary,
    borderLeftColor: colors.secondary,
    borderLeftWidth: 5,
  },
  notificationTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationType: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  notificationDate: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  notificationTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  notificationContent: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
})
