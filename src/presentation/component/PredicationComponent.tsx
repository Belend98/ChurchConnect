import type { PredicationModel } from '@/domain/entités/Predication'
import { colors } from '@/shared/theme/colors'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type PredicationComponentProps = {
  canManagePredication?: boolean
  categoryName?: string
  isDeleting?: boolean
  isFavorite?: boolean
  isFavoriting?: boolean
  isLiked?: boolean
  isLiking?: boolean
  likes?: number
  onDelete: (predication: PredicationModel) => void
  onEdit: (predication: PredicationModel) => void
  onListen: (predication: PredicationModel) => void
  onToggleFavorite: (predication: PredicationModel) => void
  onToggleLike: (predication: PredicationModel) => void
  predication: PredicationModel
}

function formatDuration(durationSeconds?: number): string {
  if (!durationSeconds) return 'Durée libre'

  const minutes = Math.max(1, Math.round(durationSeconds / 60))

  return `${minutes} min`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function PredicationComponent({
  canManagePredication = false,
  categoryName,
  isDeleting = false,
  isFavorite = false,
  isFavoriting = false,
  isLiked = false,
  isLiking = false,
  likes = 0,
  onDelete,
  onEdit,
  onListen,
  onToggleFavorite,
  onToggleLike,
  predication,
}: PredicationComponentProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topLine}>
        <View style={styles.badges}>
          <Text style={styles.serie}>{categoryName ?? 'Prédication'}</Text>
          <Text style={styles.mediaBadge}>Audio</Text>
        </View>
        <Pressable
          disabled={isFavoriting}
          onPress={() => onToggleFavorite(predication)}
          style={styles.favoriteIconButton}
        >
          <Text
            style={[
              styles.favoriteIcon,
              isFavorite && styles.favoriteIconActive,
            ]}
          >
            {isFavorite ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.main}>
        <Pressable
          onPress={() => onListen(predication)}
          style={styles.thumbnailWrap}
        >
          <View style={styles.thumbnailIcon}>
            <Text style={styles.thumbnailPlay}>▶</Text>
          </View>
        </Pressable>

        <View style={styles.info}>
          <Text style={styles.title}>{predication.title}</Text>
          <Text style={styles.verse}>{categoryName ?? 'Prédication'}</Text>
          <Text numberOfLines={1} style={styles.date}>
            {formatDate(predication.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.duration}>
          <Text style={styles.durationText}>
            {formatDuration(predication.durationSeconds)}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            disabled={isLiking}
            onPress={() => onToggleLike(predication)}
            style={[styles.likeButton, isLiked && styles.likeButtonActive]}
          >
            <Text style={[styles.likes, isLiked && styles.likesActive]}>
              {likes} ♥
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onListen(predication)}
            style={styles.listenButton}
          >
            <Text style={styles.listenButtonText}>Écouter</Text>
          </Pressable>
        </View>
      </View>

      {canManagePredication ? (
        <View style={styles.manageActions}>
          <Pressable onPress={() => onEdit(predication)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Modifier</Text>
          </Pressable>
          <Pressable
            disabled={isDeleting}
            onPress={() => onDelete(predication)}
            style={[styles.deleteButton, isDeleting && styles.disabledButton]}
          >
            <Text style={styles.deleteButtonText}>
              {isDeleting ? '...' : 'Supprimer'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 14,
  },
  topLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badges: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  main: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    height: 82,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 82,
  },
  thumbnailIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  thumbnailPlay: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 23,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  serie: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: 8,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  mediaBadge: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  favoriteIconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  favoriteIcon: {
    color: colors.onSurfaceVariant,
    fontSize: 23,
    lineHeight: 25,
  },
  favoriteIconActive: {
    color: colors.secondary,
  },
  date: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  title: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
  verse: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  duration: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  durationText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  actionButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  listenButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  listenButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  manageActions: {
    borderTopColor: colors.surfaceContainer,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.55,
  },
  likeButton: {
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  likeButtonActive: {
    borderColor: colors.secondary,
  },
  likes: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  likesActive: {
    color: colors.secondary,
  },
})
