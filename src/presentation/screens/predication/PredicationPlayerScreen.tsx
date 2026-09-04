import { colors } from '@/shared/theme/colors'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  type DimensionValue,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

const speeds = [1, 1.25, 1.5, 0.75]

function formatTime(seconds?: number | null): string {
  if (!seconds || seconds < 0) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function PredicationPlayerScreen() {
  const params = useLocalSearchParams<{
    title?: string
    mediaUrl?: string
    speaker?: string
    reference?: string
    serie?: string
    durationSeconds?: string
  }>()
  const [speedIndex, setSpeedIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const audioSource = useMemo(() => params.mediaUrl ?? null, [params.mediaUrl])
  const player = useAudioPlayer(audioSource, { updateInterval: 500 })
  const status = useAudioPlayerStatus(player)

  const title = params.title ?? 'Prédication'
  const speaker = params.speaker
  const reference = params.reference
  const serie = params.serie ?? 'Prédication'
  const duration =
    status.duration || Number(params.durationSeconds) || status.currentTime
  const progress = duration > 0 ? status.currentTime / duration : 0
  const progressWidth = `${
    Math.min(Math.max(progress, 0), 1) * 100
  }%` as DimensionValue

  function togglePlayback() {
    if (!params.mediaUrl) return

    if (status.playing) {
      player.pause()
      return
    }

    player.play()
  }

  async function seekBy(seconds: number) {
    const nextTime = Math.min(
      Math.max((status.currentTime ?? 0) + seconds, 0),
      duration,
    )

    await player.seekTo(nextTime)
  }

  function cycleSpeed() {
    const nextIndex = (speedIndex + 1) % speeds.length
    setSpeedIndex(nextIndex)
    player.setPlaybackRate(speeds[nextIndex])
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
          <Text style={styles.backLabel}>Prédications</Text>
        </Pressable>
        <Text style={styles.topAction}>Minuteur</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTopLine}>
          <Text style={styles.heroTag}>{`Série · ${serie}`}</Text>
          <Text style={styles.heroDate}>28 avril</Text>
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        {speaker || reference ? (
          <Text style={styles.heroSubtitle}>
            {[speaker, reference].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {!params.mediaUrl ? (
          <Text style={styles.playerNotice}>Aucun fichier audio disponible</Text>
        ) : null}
      </View>

      <View style={styles.playerCard}>
        <View style={styles.modeSwitch}>
          <Text style={styles.modeActive}>Mode audio</Text>
          <Text style={styles.modeInactive}>Mode vidéo</Text>
        </View>

        <View style={styles.progressArea}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.timeLine}>
            <Text style={styles.currentTime}>
              {formatTime(status.currentTime)}
            </Text>
            <Text style={styles.episode}>{serie}</Text>
            <Text style={styles.totalTime}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={cycleSpeed} style={styles.smallControl}>
            <Text style={styles.smallControlText}>{`${speeds[speedIndex]}x`}</Text>
          </Pressable>
          <Pressable onPress={() => seekBy(-15)} style={styles.roundControl}>
            <Text style={styles.roundControlText}>-15</Text>
          </Pressable>
          <Pressable onPress={togglePlayback} style={styles.playButton}>
            <Text style={styles.playButtonText}>
              {status.playing ? 'Ⅱ' : '▶'}
            </Text>
          </Pressable>
          <Pressable onPress={() => seekBy(15)} style={styles.roundControl}>
            <Text style={styles.roundControlText}>+15</Text>
          </Pressable>
          <Pressable style={styles.smallControl}>
            <Text style={styles.smallControlText}>Repère</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => setIsLiked((current) => !current)}
            style={styles.actionItem}
          >
            <Text style={[styles.actionIcon, isLiked && styles.actionActive]}>
              ♥
            </Text>
            <Text style={[styles.actionText, isLiked && styles.actionActive]}>
              {isLiked ? 'Aimé' : 'Aimer'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsFavorite((current) => !current)}
            style={styles.actionItem}
          >
            <Text
              style={[styles.actionIcon, isFavorite && styles.actionActive]}
            >
              ★
            </Text>
            <Text
              style={[styles.actionText, isFavorite && styles.actionActive]}
            >
              {isFavorite ? 'Sauvé' : 'Favori'}
            </Text>
          </Pressable>
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionText}>Partager</Text>
          </View>
          <View style={styles.actionItem}>
            <Text style={styles.actionIcon}>↓</Text>
            <Text style={styles.actionText}>Hors-ligne</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <Text style={styles.tabActive}>Résumé</Text>
        <Text style={styles.tab}>Retranscription</Text>
        <Text style={styles.tab}>Questions</Text>
      </View>

      <View style={styles.noteCard}>
        <Text style={styles.cardTitle}>Résumé non disponible</Text>
        <Text style={styles.emptyText}>
          Les notes, la retranscription et les questions pourront être affichées
          quand ces données seront ajoutées en base.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 36,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 34,
    lineHeight: 36,
  },
  backLabel: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  topAction: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '800',
  },
  hero: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    gap: 10,
    minHeight: 230,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  heroTag: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroDate: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 35,
  },
  heroSubtitle: {
    color: colors.primaryFixedDim,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  playerNotice: {
    color: colors.secondaryContainer,
    fontSize: 12,
    fontWeight: '800',
  },
  playerCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    gap: 18,
    padding: 18,
  },
  modeSwitch: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    flexDirection: 'row',
    padding: 4,
  },
  modeActive: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  modeInactive: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  progressArea: {
    gap: 8,
  },
  progressTrack: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    height: 8,
  },
  timeLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentTime: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  episode: {
    color: colors.outline,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  totalTime: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallControl: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    minWidth: 54,
    paddingHorizontal: 10,
  },
  smallControlText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  roundControl: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  roundControlText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  actions: {
    borderTopColor: colors.surfaceContainerHigh,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 68,
  },
  actionIcon: {
    color: colors.onSurfaceVariant,
    fontSize: 23,
    fontWeight: '900',
  },
  actionText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  actionActive: {
    color: colors.secondary,
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  noteCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 12,
    padding: 18,
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 22,
  },
})
