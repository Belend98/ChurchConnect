import type { PredicationModel } from '@/domain/entités/Predication'
import { colors } from '@/shared/theme/colors'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type PredicationComponentProps = {
  accentColor?: string
  likes?: number
  onListen: (predication: PredicationModel) => void
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
  likes = 0,
  onListen,
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
              {predication.categorieId ?? 'Prédication'}
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
        <Pressable
          onPress={() => onListen(predication)}
          style={styles.listenButton}
        >
          <Text style={styles.listenButtonText}>Écouter</Text>
        </Pressable>
        <View style={styles.lightActions}>
          <Text style={styles.likes}>{likes} ♥</Text>
          <Text style={styles.save}>Favori</Text>
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  lightActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  likes: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  save: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
})
