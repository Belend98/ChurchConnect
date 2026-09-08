import { colors } from '@/shared/theme/colors'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  type DimensionValue,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

const speeds = [1, 1.25, 1.5, 0.75]
const RESUME_THRESHOLD_SECONDS = 10

function formatTime(seconds?: number | null): string {
  if (!seconds || seconds < 0 || !Number.isFinite(seconds)) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function getFinitePositiveNumber(value: number | string | undefined): number {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0
}

export default function PredicationPlayerScreen() {
  const params = useLocalSearchParams<{
    id?: string
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
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false)
  const [progressTrackWidth, setProgressTrackWidth] = useState(0)

  const audioSource = useMemo(() => params.mediaUrl ?? null, [params.mediaUrl])
  const player = useAudioPlayer(audioSource, {
    keepAudioSessionActive: true,
    preferredForwardBufferDuration: 20,
    updateInterval: 500,
  })
  const status = useAudioPlayerStatus(player)

  const title = params.title ?? 'Prédication'
  const speaker = params.speaker
  const reference = params.reference
  const serie = params.serie ?? 'Prédication'
  const currentTime = getFinitePositiveNumber(status.currentTime)
  const duration =
    getFinitePositiveNumber(status.duration) ||
    getFinitePositiveNumber(params.durationSeconds)
  const progress = duration > 0 ? currentTime / duration : 0
  const remainingSeconds = Math.max(duration - currentTime, 0)
  const progressWidth = `${
    Math.min(Math.max(progress, 0), 1) * 100
  }%` as DimensionValue
  const resumeStorageKey = `predication-progress:${params.id ?? params.mediaUrl ?? title}`

  useEffect(() => {
    let isMounted = true

    async function restoreProgress() {
      if (!status.isLoaded || hasRestoredProgress) return

      const savedProgress = await AsyncStorage.getItem(resumeStorageKey)
      const savedTime = savedProgress ? Number(savedProgress) : 0

      if (
        isMounted &&
        Number.isFinite(savedTime) &&
        savedTime >= RESUME_THRESHOLD_SECONDS &&
        duration > 0 &&
        savedTime < duration - RESUME_THRESHOLD_SECONDS
      ) {
        await player.seekTo(savedTime)
      }

      if (isMounted) setHasRestoredProgress(true)
    }

    restoreProgress().catch(console.warn)

    return () => {
      isMounted = false
    }
  }, [
    duration,
    hasRestoredProgress,
    player,
    resumeStorageKey,
    status.isLoaded,
  ])

  useEffect(() => {
    if (!status.isLoaded || !hasRestoredProgress) return

    if (status.didJustFinish) {
      AsyncStorage.removeItem(resumeStorageKey).catch(console.warn)
      return
    }

    if (currentTime >= RESUME_THRESHOLD_SECONDS) {
      AsyncStorage.setItem(
        resumeStorageKey,
        String(Math.floor(currentTime)),
      ).catch(console.warn)
    }
  }, [
    currentTime,
    hasRestoredProgress,
    resumeStorageKey,
    status.didJustFinish,
    status.isLoaded,
  ])

  function togglePlayback() {
    if (!params.mediaUrl) return

    if (status.playing) {
      player.pause()
      return
    }

    player.play()
  }

  async function seekBy(seconds: number) {
    if (duration <= 0) return

    const nextTime = Math.min(
      Math.max(currentTime + seconds, 0),
      duration,
    )

    if (!Number.isFinite(nextTime)) return

    await player.seekTo(nextTime)
  }

  async function seekFromProgressPress(event: GestureResponderEvent) {
    if (!duration || progressTrackWidth <= 0) return

    const positionRatio = event.nativeEvent.locationX / progressTrackWidth
    const nextTime = Math.min(Math.max(positionRatio, 0), 1) * duration

    if (!Number.isFinite(nextTime)) return

    await player.seekTo(nextTime)
  }

  function updateProgressTrackWidth(event: LayoutChangeEvent) {
    setProgressTrackWidth(event.nativeEvent.layout.width)
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
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTopLine}>
          <Text style={styles.heroTag}>{serie}</Text>
        </View>
        <Text style={styles.heroTitle}>{title}</Text>
        {speaker || reference ? (
          <Text style={styles.heroSubtitle}>
            {[speaker, reference].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {status.error ? (
          <Text style={styles.playerNotice}>
            Lecture impossible : {status.error}
          </Text>
        ) : null}
        {!params.mediaUrl ? (
          <Text style={styles.playerNotice}>Aucun fichier audio disponible</Text>
        ) : null}
      </View>

      <View style={styles.playerCard}>
        <View style={styles.progressArea}>
          <Pressable
            onLayout={updateProgressTrackWidth}
            onPress={seekFromProgressPress}
            style={styles.progressTrack}
          >
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </Pressable>
          <View style={styles.timeLine}>
            <Text style={styles.currentTime}>
              {formatTime(currentTime)}
            </Text>
            <Text style={styles.episode}>
              -{formatTime(remainingSeconds)}
            </Text>
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
            <Text style={styles.smallControlText}>
              {hasRestoredProgress ? 'Reprise' : '...'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => setIsLiked((current) => !current)}
          style={[styles.actionButton, isLiked && styles.actionButtonActive]}
        >
          <Text style={[styles.actionText, isLiked && styles.actionActive]}>
            {isLiked ? 'Aimé' : 'Aimer'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setIsFavorite((current) => !current)}
          style={[styles.actionButton, isFavorite && styles.actionButtonActive]}
        >
          <Text style={[styles.actionText, isFavorite && styles.actionActive]}>
            {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </Text>
        </Pressable>
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
  hero: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  heroTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  heroTag: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: '700',
    lineHeight: 33,
  },
  heroSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  playerNotice: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  playerCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 18,
    padding: 18,
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
    fontWeight: '700',
  },
  episode: {
    color: colors.outline,
    fontSize: 11,
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
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    minWidth: 54,
    paddingHorizontal: 10,
  },
  smallControlText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: colors.primary,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  actionText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  actionActive: {
    color: colors.secondary,
  },
  actionButtonActive: {
    borderColor: colors.secondary,
  },
})
