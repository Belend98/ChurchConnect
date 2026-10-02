import { colors } from '@/shared/theme/colors'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  type DimensionValue,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

const speeds = [0.75, 1, 1.25, 1.5]
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
  const [speedIndex, setSpeedIndex] = useState(1)
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false)
  const [controlError, setControlError] = useState<string | null>(null)
  const [progressTrackWidth, setProgressTrackWidth] = useState(0)

  const audioSource = useMemo(() => params.mediaUrl ?? null, [params.mediaUrl])
  const player = useAudioPlayer(audioSource, {
    keepAudioSessionActive: true,
    preferredForwardBufferDuration: 20,
    updateInterval: 500,
  })
  const status = useAudioPlayerStatus(player)
  const canControl = Boolean(params.mediaUrl) && status.isLoaded && !status.error
  const isLoading = Boolean(params.mediaUrl) && !status.error && !status.isLoaded

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

  async function togglePlayback() {
    if (!canControl) return

    try {
      setControlError(null)
      if (status.playing) {
        player.pause()
        return
      }
      if (duration > 0 && currentTime >= duration) await player.seekTo(0)
      player.play()
    } catch {
      setControlError('Impossible de démarrer la lecture. Réessayez.')
    }
  }

  async function seekBy(seconds: number) {
    if (!canControl || duration <= 0) return

    const nextTime = Math.min(
      Math.max(currentTime + seconds, 0),
      duration,
    )

    if (!Number.isFinite(nextTime)) return

    await seekTo(nextTime)
  }

  async function seekFromProgressPress(event: GestureResponderEvent) {
    if (!canControl || !duration || progressTrackWidth <= 0) return

    const positionRatio = event.nativeEvent.locationX / progressTrackWidth
    const nextTime = Math.min(Math.max(positionRatio, 0), 1) * duration

    if (!Number.isFinite(nextTime)) return

    await seekTo(nextTime)
  }

  async function seekTo(time: number) {
    try {
      await player.seekTo(time)
      setControlError(null)
    } catch {
      setControlError('Impossible de déplacer la lecture. Réessayez.')
    }
  }

  function updateProgressTrackWidth(event: LayoutChangeEvent) {
    setProgressTrackWidth(event.nativeEvent.layout.width)
  }

  function changeSpeed(index: number) {
    if (!canControl) return
    try {
      player.setPlaybackRate(speeds[index])
      setSpeedIndex(index)
      setControlError(null)
    } catch {
      setControlError('Impossible de changer la vitesse. Réessayez.')
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour aux prédications" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
          <Text style={styles.backLabel}>Prédications</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTopLine}>
          <Text numberOfLines={1} style={styles.heroTag}>{serie}</Text>
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
            accessibilityRole="adjustable"
            accessibilityLabel="Position de lecture"
            accessibilityValue={{ min: 0, max: duration, now: Math.min(currentTime, duration), text: `${formatTime(currentTime)} sur ${formatTime(duration)}` }}
            accessibilityActions={[{ name: 'increment', label: 'Avancer de 15 secondes' }, { name: 'decrement', label: 'Reculer de 15 secondes' }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'increment') void seekBy(15)
              if (event.nativeEvent.actionName === 'decrement') void seekBy(-15)
            }}
            disabled={!canControl || duration <= 0}
            onLayout={updateProgressTrackWidth}
            onPress={seekFromProgressPress}
            style={styles.progressTouchArea}
          >
            <View pointerEvents="none" style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
          </Pressable>
          <View style={styles.timeLine}>
            <Text style={styles.currentTime}>
              {formatTime(currentTime)}
            </Text>
            <Text style={styles.totalTime}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Reculer de 15 secondes" disabled={!canControl} onPress={() => seekBy(-15)} style={[styles.roundControl, !canControl && styles.disabledControl]}>
            <Text style={styles.roundControlText}>↶</Text>
            <Text style={styles.skipLabel}>15 s</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? 'Mettre en pause' : 'Lire la prédication'} accessibilityState={{ disabled: !canControl, busy: isLoading || status.isBuffering }} disabled={!canControl} onPress={togglePlayback} style={[styles.playButton, !canControl && styles.disabledControl]}>
            {isLoading || (status.isBuffering && !status.playing) ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.playButtonText}>{status.playing ? 'Ⅱ' : '▶'}</Text>
            )}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Avancer de 15 secondes" disabled={!canControl} onPress={() => seekBy(15)} style={[styles.roundControl, !canControl && styles.disabledControl]}>
            <Text style={styles.roundControlText}>↷</Text>
            <Text style={styles.skipLabel}>15 s</Text>
          </Pressable>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.playbackStatus}>
          {isLoading ? 'Chargement de l’audio…' : status.isBuffering ? 'Mise en mémoire tampon…' : duration > 0 ? `${formatTime(remainingSeconds)} restantes` : 'Lecture audio'}
        </Text>
        <View style={styles.speedArea}>
          <Text style={styles.speedLabel}>Vitesse de lecture</Text>
          <View style={styles.speedOptions}>
            {speeds.map((speed, index) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Vitesse ${speed} fois`}
                accessibilityState={{ selected: index === speedIndex, disabled: !canControl }}
                disabled={!canControl}
                key={speed}
                onPress={() => changeSpeed(index)}
                style={[styles.smallControl, index === speedIndex && styles.speedActive, !canControl && styles.disabledControl]}
              >
                <Text style={[styles.smallControlText, index === speedIndex && styles.speedTextActive]}>{speed}×</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {controlError ? <Text accessibilityLiveRegion="polite" style={styles.playerNotice}>{controlError}</Text> : null}
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    gap: 12,
    padding: 16,
    paddingBottom: 36,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  backButton: {
    minHeight: 44,
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
    gap: 8,
    padding: 16,
  },
  heroTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  heroTag: {
    flexShrink: 1,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 30,
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
    gap: 12,
    padding: 16,
  },
  progressArea: {
    gap: 0,
  },
  progressTouchArea: {
    minHeight: 44,
    justifyContent: 'center',
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
  totalTime: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  smallControl: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    flex: 1,
    minWidth: 44,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  smallControlText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  roundControl: {
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  roundControlText: {
    color: colors.primary,
    fontSize: 23,
    lineHeight: 25,
    fontWeight: '900',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  skipLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  playbackStatus: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
  },
  speedArea: {
    borderTopColor: colors.surfaceContainerHigh,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  speedLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  speedOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  speedActive: {
    backgroundColor: colors.primary,
  },
  speedTextActive: {
    color: '#ffffff',
  },
  disabledControl: {
    opacity: 0.5,
  },
})
