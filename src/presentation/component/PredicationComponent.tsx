import type { PredicationModel } from '@/domain/entités/Predication'
import { colors } from '@/shared/theme/colors'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type PredicationComponentProps = {
  accentColor?: string
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
  accentColor = colors.primaryFixed,
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
      <View style={styles.main}>
        <View style={[styles.thumbnail, { backgroundColor: accentColor }]}>
          <Text style={styles.thumbnailText}>
            {formatDuration(predication.durationSeconds)}
          </Text>
        </View>

        <View style={styles.info}>
          <View style={styles.metaLine}>
            <Text style={styles.serie}>
              {categoryName ?? 'Prédication'}
            </Text>
            <Text style={styles.date}>{formatDate(predication.createdAt)}</Text>
          </View>
          <Text style={styles.title}>{predication.title}</Text>
          <Text numberOfLines={1} style={styles.mediaUrl}>
            {predication.mediaUrl}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.primaryActions}>
          <Pressable
            onPress={() => onListen(predication)}
            style={styles.listenButton}
          >
            <Text style={styles.listenButtonText}>Écouter</Text>
          </Pressable>
          {canManagePredication ? (
            <>
              <Pressable
                onPress={() => onEdit(predication)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>Modifier</Text>
              </Pressable>
              <Pressable
                disabled={isDeleting}
                onPress={() => onDelete(predication)}
                style={[
                  styles.deleteButton,
                  isDeleting && styles.disabledButton,
                ]}
              >
                <Text style={styles.deleteButtonText}>
                  {isDeleting ? '...' : 'Supprimer'}
                </Text>
              </Pressable>
            </>
          ) : null}
        </View>
        <View style={styles.lightActions}>
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
            disabled={isFavoriting}
            onPress={() => onToggleFavorite(predication)}
            style={[
              styles.favoriteButton,
              isFavorite && styles.favoriteButtonActive,
            ]}
          >
            <Text
              style={[
                styles.favoriteButtonText,
                isFavorite && styles.favoriteButtonTextActive,
              ]}
            >
              {isFavorite ? 'Favori ✓' : 'Favori'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 14,
    padding: 16,
  },
  main: {
    flexDirection: 'row',
    gap: 14,
  },
  thumbnail: {
    alignItems: 'center',
    borderRadius: 12,
    height: 86,
    justifyContent: 'flex-end',
    padding: 8,
    width: 86,
  },
  thumbnailText: {
    backgroundColor: 'rgba(3, 31, 65, 0.88)',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  info: {
    flex: 1,
    gap: 5,
  },
  metaLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  serie: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
    color: colors.primary,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  date: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
  mediaUrl: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  primaryActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listenButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  listenButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.error,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
  lightActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  likeButton: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  likeButtonActive: {
    backgroundColor: colors.secondaryFixed,
  },
  likes: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  likesActive: {
    color: colors.secondary,
  },
  favoriteButton: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  favoriteButtonActive: {
    backgroundColor: colors.primaryFixed,
  },
  favoriteButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  favoriteButtonTextActive: {
    color: colors.primary,
  },
})
