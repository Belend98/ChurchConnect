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
          <Text style={styles.title}>Bonjour,</Text>
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
    gap: 16,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    paddingTop: 8,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  sermonCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  sermonTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
  },
  sermonSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
})
