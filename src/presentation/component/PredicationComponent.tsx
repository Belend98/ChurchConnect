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
  if (!durationSeconds) return ''

  const minutes = Math.max(1, Math.round(durationSeconds / 60))

  return `${minutes} min`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
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
  const duration = formatDuration(predication.durationSeconds)

  return (
    <View style={styles.card}>
      <View style={styles.main}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Écouter ${predication.title}`}
          onPress={() => onListen(predication)}
          style={styles.thumbnailWrap}
        >
          <View style={styles.thumbnailIcon}>
            <Text style={styles.thumbnailPlay}>▶</Text>
          </View>
        </Pressable>

        <View style={styles.info}>
          <Text numberOfLines={2} style={styles.title}>{predication.title}</Text>
          {categoryName ? <Text numberOfLines={1} style={styles.verse}>{categoryName}</Text> : null}
          <View style={styles.metadata}>
            <Text style={styles.date}>{formatDate(predication.createdAt)}</Text>
            {duration ? <Text style={styles.durationText}>· {duration}</Text> : null}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          accessibilityState={{ selected: isFavorite, disabled: isFavoriting, busy: isFavoriting }}
          disabled={isFavoriting}
          onPress={() => onToggleFavorite(predication)}
          style={[styles.favoriteIconButton, isFavoriting && styles.disabledButton]}
        >
          <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>
            {isFavorite ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${isLiked ? 'Retirer mon like' : 'Aimer cette prédication'}, ${likes} likes`}
          accessibilityState={{ selected: isLiked, disabled: isLiking, busy: isLiking }}
          disabled={isLiking}
          onPress={() => onToggleLike(predication)}
          style={[styles.likeButton, isLiked && styles.likeButtonActive, isLiking && styles.disabledButton]}
        >
          <Text style={[styles.likes, isLiked && styles.likesActive]}>
            {likes} ♥
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Écouter ${predication.title}`}
          onPress={() => onListen(predication)}
          style={styles.listenButton}
        >
          <Text style={styles.listenButtonText}>Écouter</Text>
        </Pressable>
      </View>

      {canManagePredication ? (
        <View style={styles.manageActions}>
          <Pressable accessibilityRole="button" disabled={isDeleting} onPress={() => onEdit(predication)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Modifier</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
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
    gap: 8,
    overflow: 'hidden',
    padding: 12,
  },
  main: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  thumbnailWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
    flexShrink: 0,
  },
  thumbnailIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  thumbnailPlay: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 23,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  favoriteIconButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 44,
    justifyContent: 'center',
    width: 44,
    flexShrink: 0,
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
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  verse: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metadata: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 5,
    rowGap: 2,
  },
  durationText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  listenButton: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingTop: 8,
  },
  editButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.55,
  },
  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 56,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
