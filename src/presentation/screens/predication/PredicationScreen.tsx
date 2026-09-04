import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import {
  Alert,
  Platform,
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

const accentColors = [
  colors.secondaryFixed,
  colors.surfaceContainerHigh,
  colors.primaryFixed,
  colors.tertiaryFixed,
]

export default function PredicationScreen() {
  const [predications, setPredications] = useState<PredicationModel[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  function openUpdate(predication: PredicationModel) {
    router.push(
      {
        pathname: '/update-predication',
        params: {
          categorieId: predication.categorieId ?? '',
          durationSeconds: String(predication.durationSeconds ?? ''),
          id: predication.id,
          mediaUrl: predication.mediaUrl,
          title: predication.title,
        },
      } as never,
    )
  }

  function confirmDelete(predication: PredicationModel) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Voulez-vous vraiment supprimer "${predication.title}" ?`,
      )

      if (confirmed) void deletePredication(predication)
      return
    }

    Alert.alert(
      'Supprimer la prédication',
      `Voulez-vous vraiment supprimer "${predication.title}" ?`,
      [
        { style: 'cancel', text: 'Annuler' },
        {
          onPress: () => deletePredication(predication),
          style: 'destructive',
          text: 'Supprimer',
        },
      ],
    )
  }

  async function deletePredication(predication: PredicationModel) {
    setDeletingId(predication.id)

    try {
      await predicationService.deletePredication(predication.id)
      setPredications((current) =>
        current.filter((item) => item.id !== predication.id),
      )
    } catch (error) {
      console.warn(error)
      Alert.alert(
        'Suppression impossible',
        toErrorMessage(error, "Une erreur est survenue pendant la suppression."),
      )
    } finally {
      setDeletingId(null)
    }
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

      {predications[0] ? (
        <Pressable
          onPress={() => openPlayer(predications[0])}
          style={styles.resumeCard}
        >
          <View>
            <Text style={styles.resumeLabel}>Dernière prédication</Text>
            <Text style={styles.resumeTitle}>{predications[0].title}</Text>
            <Text style={styles.resumeMeta}>
              {predications[0].categorieId ?? 'Prédication'}
            </Text>
          </View>
          <View style={styles.resumeButton}>
            <Text style={styles.resumeButtonText}>▶</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Toutes les prédications</Text>
        <Text style={styles.sectionMeta}>
          {isLoading ? 'Chargement' : `${predications.length} messages`}
        </Text>
      </View>

      <View style={styles.sermonList}>
        {predications.map((predication, index) => (
          <PredicationComponent
            accentColor={accentColors[index % accentColors.length]}
            isDeleting={deletingId === predication.id}
            key={predication.id}
            onDelete={confirmDelete}
            onEdit={openUpdate}
            onListen={openPlayer}
            predication={predication}
          />
        ))}
      </View>

      {!isLoading && predications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucune prédication</Text>
          <Text style={styles.emptyText}>
            Créez une prédication pour la voir apparaître ici.
          </Text>
        </View>
      ) : null}
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
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 8,
    padding: 18,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
})
