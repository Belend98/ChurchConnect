import { notificationService } from '@/composition/notification'
import { groupeService } from '@/composition/groupe'
import type { NotificationModel } from '@/domain/entities/Notification'
import { useNotifications } from '@/presentation/hooks/notification/useNotifications'
import { applyNotificationChange, notificationsQueryKey } from '@/presentation/queries/notificationQueries'
import { groupeKeys, removeCachedGroupe } from '@/presentation/queries/groupeQueries'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

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
  const queryClient = useQueryClient()
  const {
    data: notifications = [], userId, unreadCount,
    isPending: isLoading, error: loadError, isError, refetch,
  } = useNotifications()
  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllMyNotificationsAsRead(),
    onMutate: () => ({ userId }),
    onSuccess: (items, _variables, context) => {
      if (userId && context?.userId === userId) {
        return applyNotificationChange(queryClient, userId, { type: 'read', notifications: items })
      }
    },
  })
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markMyNotificationAsRead(id),
    onMutate: () => ({ userId }),
    onSuccess: (item, id, context) => {
      if (userId && context?.userId === userId) {
        return applyNotificationChange(queryClient, userId, item
          ? { type: 'read', notifications: [item] }
          : { type: 'delete', id })
      }
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationService.deleteMyNotification(id),
    onMutate: () => ({ userId }),
    onSuccess: (_result, id, context) => {
      if (userId && context?.userId === userId) {
        return applyNotificationChange(queryClient, userId, { type: 'delete', id })
      }
    },
  })
  const isMarkingAllAsRead = markAllMutation.isPending
  const deleteAllMutation = useMutation({
    mutationFn: () => notificationService.deleteAllMyNotifications(),
    onMutate: () => ({ userId }),
    onSuccess: (_result, _variables, context) => {
      if (userId && context?.userId === userId) {
        // Recharger conserve les nouvelles notifications arrivées pendant la suppression.
        return queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId), exact: true })
      }
    },
  })
  const isDeletingAll = deleteAllMutation.isPending
  const checkGroupMutation = useMutation({
    mutationFn: (id: string) => groupeService.getGroupe(id),
  })
  const isBusy = markReadMutation.isPending || deleteMutation.isPending || isMarkingAllAsRead || isDeletingAll || checkGroupMutation.isPending

  async function deleteAllNotifications() {
    if (isBusy || !userId || notifications.length === 0) return
    setError(null)
    try {
      await deleteAllMutation.mutateAsync()
    } catch (deleteError) {
      setError(toErrorMessage(deleteError, 'Impossible de supprimer les notifications.'))
    }
  }

  function confirmDeleteAllNotifications() {
    if (isBusy || !userId || notifications.length === 0) return
    const message = 'Supprimer toutes vos notifications ?'
    if (Platform.OS === 'web') {
      if (window.confirm(message)) void deleteAllNotifications()
      return
    }
    Alert.alert('Tout supprimer', message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Tout supprimer', style: 'destructive', onPress: () => void deleteAllNotifications() },
    ])
  }

  async function deleteNotification(id: string) {
    setError(null)

    try {
      await deleteMutation.mutateAsync(id)
    } catch (deleteError) {
      setError(toErrorMessage(deleteError, 'Impossible de supprimer cette notification.'))
    }
  }

  async function markAllAsRead() {
    setError(null)

    try {
      await markAllMutation.mutateAsync()
    } catch (markError) {
      setError(
        toErrorMessage(markError, 'Impossible de marquer les notifications.'),
      )
    }
  }

  async function openNotification(notification: NotificationModel) {
    if (isBusy || !userId) return
    setError(null)
    if (!notification.isRead) {
      try {
        await markReadMutation.mutateAsync(notification.id)
      } catch (markError) {
        setError(toErrorMessage(markError, 'Impossible de marquer cette notification.'))
        return
      }
    }

    if (
      notification.type === 'message_groupe' ||
      notification.type === 'groupe_invitation'
    ) {
      if (!notification.referenceId) {
        setError('Ce groupe n’est plus accessible : il a été supprimé ou votre accès a été retiré.')
        return
      }
      try {
        const groupe = await checkGroupMutation.mutateAsync(notification.referenceId)
        if (!groupe) {
          removeCachedGroupe(queryClient, userId, notification.referenceId)
          setError('Ce groupe n’est plus accessible : il a été supprimé ou votre accès a été retiré.')
          return
        }
        queryClient.setQueryData(groupeKeys.detail(userId, groupe.id), groupe)
        router.push({
          pathname: '/groupe-detail',
          params: { id: groupe.id, name: groupe.name },
        })
      } catch (groupError) {
        setError(toErrorMessage(groupError, 'Impossible de vérifier l’accès au groupe.'))
      }
      return
    }

    if (notification.type === 'annonce') {
      router.push('/(tabs)/home')
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.headerTitle}>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.bulkActions}>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy || unreadCount === 0}
          onPress={markAllAsRead}
          style={[
            styles.markAllButton,
            (isBusy || unreadCount === 0) &&
              styles.disabledButton,
          ]}
        >
          <Text style={styles.markAllButtonText}>
            {isMarkingAllAsRead ? 'Lecture...' : 'Tout lire'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isBusy || isLoading || isError || !userId || notifications.length === 0}
          onPress={confirmDeleteAllNotifications}
          style={[
            styles.deleteAllButton,
            (isBusy || isLoading || isError || !userId || notifications.length === 0) && styles.disabledButton,
          ]}
        >
          <Text style={styles.deleteAllButtonText}>
            {isDeletingAll ? 'Suppression...' : 'Tout supprimer'}
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

        {!isLoading && !isError && notifications.length === 0 ? (
          <Text style={styles.metaText}>
            Aucune notification pour le moment.
          </Text>
        ) : null}

        {notifications.map((notification) => (
          <View
            key={notification.id}
            style={[
              styles.notificationItem,
              !notification.isRead && styles.unreadNotificationItem,
            ]}
          >
            <View style={styles.notificationTopLine}>
              <Text style={styles.notificationType}>
                {getTypeLabel(notification)}
              </Text>
              <View style={styles.notificationActions}>
                <Text style={styles.notificationDate}>
                  {formatNotificationDate(notification.createdAt)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Supprimer la notification : ${notification.titre}`}
                  disabled={isBusy}
                  onPress={() => void deleteNotification(notification.id)}
                  style={[styles.deleteButton, isBusy && styles.disabledButton]}
                >
                  {deleteMutation.isPending && deleteMutation.variables === notification.id ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Text style={styles.deleteButtonText}>Supprimer</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir la notification : ${notification.titre}`}
              disabled={isBusy}
              onPress={() => void openNotification(notification)}
              style={styles.notificationBody}
            >
              <Text style={styles.notificationTitle}>{notification.titre}</Text>
              <Text numberOfLines={2} style={styles.notificationContent}>
                {notification.contenu}
              </Text>
            </Pressable>
          </View>
        ))}

        {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
        {isError ? (
          <View>
            <Text style={styles.errorText}>
              {toErrorMessage(loadError, 'Impossible de charger les notifications.')}
            </Text>
            <Pressable onPress={() => void refetch()}>
              <Text style={styles.metaText}>Réessayer</Text>
            </Pressable>
          </View>
        ) : null}
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
  headerTitle: {
    alignItems: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 28,
  },
  bulkActions: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
    maxWidth: 520,
    paddingHorizontal: 16,
    paddingTop: 12,
    width: '100%',
  },
  deleteAllButton: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  deleteAllButtonText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '900',
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
  notificationActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  notificationBody: {
    gap: 7,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 8,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
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
