import { colors } from '@/shared/theme/colors'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { PredicationComponent } from '@/presentation/component/PredicationComponent'
import { predicationService } from '@/composition/predication'
import type { PredicationModel } from '@/domain/entités/Predication'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'

const filters = ['Tous', 'Audio', 'Vidéo', 'Série en cours', 'Jeunesse']

const demoPredications: PredicationModel[] = [
  {
    id: 'demo-1',
    title: 'Marcher avec confiance dans la tempête',
    durationSeconds: 1930,
    categorieId: 'Foi Vraie',
    createdAt: new Date('2023-10-15'),
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'demo-2',
    title: "L'Amour fraternel au quotidien",
    durationSeconds: 1500,
    categorieId: 'Vivre ensemble',
    createdAt: new Date('2023-10-08'),
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'demo-3',
    title: 'Prendre soin les uns des autres',
    durationSeconds: 2400,
    categorieId: 'Aînés et familles',
    createdAt: new Date('2023-10-01'),
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'demo-4',
    title: 'Lève-toi et brille',
    durationSeconds: 1320,
    categorieId: 'Jeunesse et ados',
    createdAt: new Date('2023-09-24'),
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
]

const accentColors = [
  colors.secondaryFixed,
  colors.surfaceContainerHigh,
  colors.primaryFixed,
  colors.tertiaryFixed,
]

export default function PredicationScreen() {
  const [predications, setPredications] = useState<PredicationModel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      setIsLoading(true)

      predicationService
        .listPredications()
        .then((items) => {
          if (!isMounted) return
          setPredications(items)
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

  const displayedPredications =
    predications.length > 0 ? predications : demoPredications

  function openPlayer(predication: PredicationModel) {
    router.push(
      {
        pathname: '/predication-player',
        params: {
          durationSeconds: String(predication.durationSeconds ?? ''),
          mediaUrl: predication.mediaUrl,
          serie: predication.categorieId ?? 'Prédication',
          title: predication.title,
        },
      } as never,
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Ressources spirituelles</Text>
          <Text style={styles.title}>Prédications</Text>
        </View>
        <Pressable
          onPress={() => router.push('/create-predication' as never)}
          style={styles.sortButton}
        >
          <Text style={styles.sortButtonText}>Créer</Text>
        </Pressable>
      </View>

      <Text style={styles.intro}>
        Retrouvez les messages à écouter, méditer ou garder pour plus tard.
      </Text>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Rechercher un thème, pasteur, verset..."
          placeholderTextColor={colors.outline}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.filterList}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter, index) => (
          <Pressable
            key={filter}
            style={[styles.filterPill, index === 0 && styles.filterPillActive]}
          >
            <Text
              style={[
                styles.filterText,
                index === 0 && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.resumeCard}>
        <View>
          <Text style={styles.resumeLabel}>Dernière méditation</Text>
          <Text style={styles.resumeTitle}>Foi Vraie · Chapitre 4</Text>
          <Text style={styles.resumeMeta}>Reprendre à 18:42</Text>
        </View>
        <Pressable style={styles.resumeButton}>
          <Text style={styles.resumeButtonText}>▶</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Toutes les prédications</Text>
        <Text style={styles.sectionMeta}>
          {isLoading
            ? 'Chargement'
            : `${displayedPredications.length} messages`}
        </Text>
      </View>

      <View style={styles.sermonList}>
        {displayedPredications.map((predication, index) => (
          <PredicationComponent
            accentColor={accentColors[index % accentColors.length]}
            key={predication.id}
            likes={index === 0 ? 230 : 0}
            onListen={openPlayer}
            predication={predication}
          />
        ))}
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
  sortButton: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  intro: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  searchIcon: {
    color: colors.onSurfaceVariant,
    fontSize: 24,
    fontWeight: '700',
  },
  searchInput: {
    color: colors.onSurface,
    flex: 1,
    fontSize: 15,
    minHeight: 54,
  },
  filterList: {
    gap: 10,
    paddingRight: 20,
  },
  filterPill: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  resumeCard: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  resumeLabel: {
    color: colors.secondaryContainer,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resumeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  resumeMeta: {
    color: '#b0c7f1',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  resumeButton: {
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  resumeButtonText: {
    color: '#390c00',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  sectionMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  sermonList: {
    gap: 12,
  },
  sermonCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 14,
    padding: 16,
  },
  sermonMain: {
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
  sermonInfo: {
    flex: 1,
    gap: 5,
  },
  sermonMetaLine: {
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
  sermonDate: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  sermonTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
  sermonSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 19,
  },
  cardActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listenButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
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
