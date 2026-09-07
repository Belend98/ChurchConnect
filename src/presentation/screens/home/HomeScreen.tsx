import { predicationService } from '@/composition/predication'
import type { PredicationModel } from '@/domain/entités/Predication'
import { colors } from '@/shared/theme/colors'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function HomeScreen() {
  const [predications, setPredications] = useState<PredicationModel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      setIsLoading(true)

      predicationService
        .listPredications()
        .then((predicationItems) => {
          if (!isMounted) return
          setPredications(predicationItems)
        })
        .catch((error) => {
          if (!isMounted) return
          console.warn(error)
          setPredications([])
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })

      return () => {
        isMounted = false
      }
    }, []),
  )

  const latestPredication = predications[0]

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Communauté réunie</Text>
          <Text style={styles.title}>Bonjour,</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>F</Text>
        </View>
      </View>

      <View style={styles.sermonCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dernière prédication</Text>
          <Text style={styles.sectionMeta}>
            {isLoading ? 'Chargement' : `${predications.length} total`}
          </Text>
        </View>
        {latestPredication ? (
          <>
            <Text style={styles.sermonTitle}>{latestPredication.title}</Text>
            <Text style={styles.sermonSubtitle}>
              {latestPredication.categorieId ?? 'Prédication'}
            </Text>
          </>
        ) : (
          <Text style={styles.sermonSubtitle}>
            Aucune prédication enregistrée pour le moment.
          </Text>
        )}
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
    gap: 18,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  intro: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  verseCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    gap: 14,
    padding: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  verseText: {
    color: colors.primary,
    fontSize: 19,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 29,
  },
  shortcutGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcut: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 94,
    padding: 12,
  },
  shortcutIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  shortcutInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  shortcutLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  sermonCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 10,
    padding: 18,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  sermonTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  sermonSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 13,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  announcementList: {
    gap: 10,
  },
  announcementCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 6,
    padding: 16,
  },
  announcementTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  announcementDate: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  tag: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  announcementTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  announcementDescription: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  prayerCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  prayerAccent: {
    alignSelf: 'stretch',
    backgroundColor: colors.secondary,
    borderRadius: 999,
    width: 4,
  },
  prayerContent: {
    flex: 1,
    gap: 8,
  },
  prayerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  prayerText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  secondaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryContainer,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 2,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#390c00',
    fontSize: 14,
    fontWeight: '800',
  },
})
