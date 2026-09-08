import { authService } from '@/composition/Auth'
import { groupeService } from '@/composition/groupe'
import { predicationService } from '@/composition/predication'
import { profilService } from '@/composition/profil'
import type { PredicationModel } from '@/domain/entités/Predication'
import { getAppRoleLabel, type ProfilModel } from '@/domain/entités/Profil'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

type EspaceStats = {
  favorites: number
  groupes: number
  predications: number
}

type CurrentProfile = ProfilModel & {
  email?: string | null
}

const initialStats: EspaceStats = {
  favorites: 0,
  groupes: 0,
  predications: 0,
}

function getDisplayName(profile: CurrentProfile | null): string {
  if (!profile) return 'Mon espace'

  const fullName = [profile.prenom, profile.nom].filter(Boolean).join(' ')

  return fullName || profile.username || 'Mon espace'
}

export default function MonEspaceScreen() {
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [favoritePredications, setFavoritePredications] = useState<
    PredicationModel[]
  >([])
  const [profile, setProfile] = useState<CurrentProfile | null>(null)
  const [stats, setStats] = useState<EspaceStats>(initialStats)

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      setIsLoading(true)
      setErrorText(null)

      Promise.all([
        profilService.getCurrentUserProfileOrThrow(),
        groupeService.listGroupes(),
        predicationService.listPredications(),
        predicationService.listMyFavorites().catch(() => []),
      ])
        .then(([profileItem, groupes, predications, favorites]) => {
          if (!isMounted) return
          const favoriteIds = new Set(
            favorites.map((favorite) => favorite.predicationId),
          )

          setProfile(profileItem)
          setFavoritePredications(
            predications.filter((predication) => favoriteIds.has(predication.id)),
          )
          setStats({
            favorites: favorites.length,
            groupes: groupes.length,
            predications: predications.length,
          })
        })
        .catch((error) => {
          if (!isMounted) return
          console.warn(error)
          setErrorText(toErrorMessage(error))
          setFavoritePredications([])
          setProfile(null)
          setStats(initialStats)
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })

      return () => {
        isMounted = false
      }
    }, []),
  )

  async function signOut() {
    try {
      await authService.signOut()
      router.replace('/(auth)/signin')
    } catch (error) {
      Alert.alert('Erreur', toErrorMessage(error, 'Impossible de se déconnecter.'))
    }
  }

  function openPlayer(predication: PredicationModel) {
    router.push(
      {
        pathname: '/predication-player',
        params: {
          durationSeconds: String(predication.durationSeconds ?? ''),
          id: predication.id,
          mediaUrl: predication.mediaUrl,
          serie: predication.categorieId ?? 'Prédication',
          title: predication.title,
        },
      } as never,
    )
  }

  const displayName = getDisplayName(profile)
  const avatarInitial = displayName.charAt(0).toUpperCase()

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bienvenue, {displayName}</Text>
        </View>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{avatarInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text numberOfLines={1} style={styles.profileMeta}>
              {profile?.email ?? 'Utilisateur connecté'}
            </Text>
            <Text style={styles.profileRole}>
              {getAppRoleLabel(profile?.roleApp)}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(auth)/profil' as never)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Modifier mon profil</Text>
        </Pressable>
      </View>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{isLoading ? '...' : stats.groupes}</Text>
          <Text style={styles.statLabel}>Groupes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {isLoading ? '...' : stats.predications}
          </Text>
          <Text style={styles.statLabel}>Prédications</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {isLoading ? '...' : stats.favorites}
          </Text>
          <Text style={styles.statLabel}>Favoris</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favoris</Text>
          <Text style={styles.sectionMeta}>
            {isLoading ? '...' : favoritePredications.length}
          </Text>
        </View>

        {favoritePredications.slice(0, 3).map((predication) => (
          <Pressable
            key={predication.id}
            onPress={() => openPlayer(predication)}
            style={styles.favoriteRow}
          >
            <View style={styles.favoriteIcon}>
              <Text style={styles.favoriteIconText}>★</Text>
            </View>
            <View style={styles.favoriteBody}>
              <Text numberOfLines={1} style={styles.favoriteTitle}>
                {predication.title}
              </Text>
              <Text style={styles.favoriteText}>
                {predication.categorieId ?? 'Prédication'}
              </Text>
            </View>
            <Text style={styles.linkArrow}>›</Text>
          </Pressable>
        ))}

        {!isLoading && favoritePredications.length === 0 ? (
          <View style={styles.emptyFavorites}>
            <Text style={styles.emptyFavoritesText}>
              Aucune prédication favorite pour le moment.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/predication' as never)}
          style={styles.linkRow}
        >
          <View>
            <Text style={styles.linkTitle}>Toutes les prédications</Text>
            <Text style={styles.linkText}>Écouter et gérer les favoris</Text>
          </View>
          <Text style={styles.linkArrow}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/groupe' as never)}
          style={styles.linkRow}
        >
          <View>
            <Text style={styles.linkTitle}>Mes groupes</Text>
            <Text style={styles.linkText}>Rejoindre vos discussions</Text>
          </View>
          <Text style={styles.linkArrow}>›</Text>
        </Pressable>
      </View>

      <Pressable onPress={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutButtonText}>Se déconnecter</Text>
      </Pressable>
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
    gap: 14,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
  },
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  profileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  profileAvatarText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '700',
  },
  profileMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
  profileRole: {
    alignSelf: 'flex-start',
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    minHeight: 46,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minHeight: 82,
    justifyContent: 'center',
    padding: 10,
  },
  statValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  favoriteRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    padding: 14,
  },
  favoriteIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  favoriteIconText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  favoriteBody: {
    flex: 1,
    gap: 3,
  },
  favoriteTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  favoriteText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  emptyFavorites: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  emptyFavoritesText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 20,
  },
  linkRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 70,
    padding: 16,
  },
  linkTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  linkText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    marginTop: 3,
  },
  linkArrow: {
    color: colors.onSurfaceVariant,
    fontSize: 28,
    fontWeight: '700',
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  signOutButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '900',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
})
