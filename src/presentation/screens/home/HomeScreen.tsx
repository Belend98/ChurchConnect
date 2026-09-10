import { annonceService } from '@/composition/annonce'
import { notificationService } from '@/composition/notification'
import { predicationService } from '@/composition/predication'
import { profilService } from '@/composition/profil'
import type { AnnonceModel } from '@/domain/entités/Annonce'
import type { PredicationModel } from '@/domain/entités/Predication'
import { canManagePredications } from '@/domain/entités/Profil'
import { colors } from '@/shared/theme/colors'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

const DEFAULT_SERMON_IMAGE_URL =
  'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80'

function getGreetingName(profileName: string | null) {
  return profileName ? `Bonjour, ${profileName}` : 'Bonjour,'
}

export default function HomeScreen() {
  const [annonces, setAnnonces] = useState<AnnonceModel[]>([])
  const [currentAnnonceIndex, setCurrentAnnonceIndex] = useState(0)
  const [canCreateAnnonce, setCanCreateAnnonce] = useState(false)
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [predications, setPredications] = useState<PredicationModel[]>([])
  const [isLoadingAnnonces, setIsLoadingAnnonces] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      setIsLoading(true)
      setIsLoadingAnnonces(true)

      profilService
        .getCurrentUserProfileOrThrow()
        .then((profile) => {
          if (!isMounted) return
          setProfileName(profile.prenom ?? profile.username ?? null)
          setCanCreateAnnonce(canManagePredications(profile.roleApp))
        })
        .catch((error) => {
          if (!isMounted) return
          console.warn(error)
          setProfileName(null)
          setCanCreateAnnonce(false)
        })

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

      annonceService
        .listAnnonces()
        .then((annonceItems) => {
          if (!isMounted) return
          setAnnonces(annonceItems)
          setCurrentAnnonceIndex(0)
        })
        .catch((error) => {
          if (!isMounted) return
          console.warn(error)
          setAnnonces([])
        })
        .finally(() => {
          if (isMounted) setIsLoadingAnnonces(false)
        })

      return () => {
        isMounted = false
      }
    }, []),
  )

  const refreshNotificationUnreadCount = useCallback(() => {
    notificationService
      .countUnreadForCurrentUser()
      .then(setNotificationUnreadCount)
      .catch((error) => {
        console.warn(error)
        setNotificationUnreadCount(0)
      })
  }, [])

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      let unsubscribe: (() => void) | undefined

      refreshNotificationUnreadCount()

      notificationService
        .subscribeToMyNotifications(() => {
          if (isMounted) refreshNotificationUnreadCount()
        })
        .then((unsubscribeNotification) => {
          unsubscribe = unsubscribeNotification
        })
        .catch((error) => {
          console.warn(error)
        })

      return () => {
        isMounted = false
        unsubscribe?.()
      }
    }, [refreshNotificationUnreadCount]),
  )

  const latestPredication = predications[0]
  const currentAnnonce = annonces[currentAnnonceIndex]
  const hasMultipleAnnonces = annonces.length > 1

  function goToAnnonce(index: number) {
    if (annonces.length === 0) return

    const nextIndex = (index + annonces.length) % annonces.length
    setCurrentAnnonceIndex(nextIndex)
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appBar}>
          <View style={styles.appBarBrand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>✝</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Foi & Communauté</Text>
              <Text style={styles.appBarTitle}>Accueil</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/notifications' as never)}
            style={styles.notificationButton}
          >
            <Text style={styles.notificationButtonText}>N</Text>
            {notificationUnreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/mon-espace' as never)}
            style={styles.profileButton}
          >
            <Text style={styles.profileButtonText}>
              {(profileName ?? 'M').charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{getGreetingName(profileName)}</Text>
          <Text style={styles.subtitle}>
            Bienvenue dans l’espace de votre communauté
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dernière prédication</Text>
          <Text style={styles.sectionMeta}>
            {isLoading ? 'Chargement' : `${predications.length} total`}
          </Text>
        </View>

        <View style={styles.sermonCard}>
          <View style={styles.sermonMedia}>
            <Image
              source={{ uri: DEFAULT_SERMON_IMAGE_URL }}
              style={styles.sermonImage}
            />
            <View style={styles.sermonImageShade} />
            <View style={styles.sermonMediaTop}>
              <Text style={styles.sermonBadge}>Audio</Text>
              <Text style={styles.sermonDuration}>Prédication</Text>
            </View>
            <Text style={styles.sermonMediaDate}>
              {isLoading ? 'Chargement' : `${predications.length} total`}
            </Text>
          </View>

          <View style={styles.sermonBody}>
            <Text style={styles.sermonKicker}>Message récent</Text>
          {latestPredication ? (
            <>
              <Text style={styles.sermonTitle}>{latestPredication.title}</Text>
                <Text style={styles.sermonSubtitle}>
                {latestPredication.categorieId ?? 'Prédication'}
              </Text>
                <Pressable
                  onPress={() =>
                    router.push(
                      {
                        pathname: '/predication-player',
                        params: { id: latestPredication.id },
                      } as never,
                    )
                  }
                  style={styles.listenButton}
                >
                  <Text style={styles.listenButtonText}>Écouter</Text>
                </Pressable>
            </>
          ) : (
              <Text style={styles.sermonSubtitle}>
              Aucune prédication enregistrée pour le moment.
            </Text>
          )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Annonces</Text>
          <Text style={styles.sectionMeta}>
            {isLoadingAnnonces ? 'Chargement' : `${annonces.length} total`}
          </Text>
        </View>

        <View style={styles.annonceCard}>
          {!isLoadingAnnonces && annonces.length === 0 ? (
            <Text style={styles.sermonSubtitle}>
              Aucune annonce pour le moment.
            </Text>
          ) : null}

          {currentAnnonce ? (
            <View style={styles.annonceCarousel}>
              <View style={styles.annonceItem}>
                {currentAnnonce.imageUrl ? (
                  <Image
                    source={{ uri: currentAnnonce.imageUrl }}
                    style={styles.annonceImage}
                  />
                ) : (
                  <View style={styles.annonceImageFallback}>
                    <Text style={styles.annonceImageFallbackText}>Annonce</Text>
                  </View>
                )}

                <View style={styles.annonceBody}>
                  <Text style={styles.annonceBadge}>Vie communautaire</Text>
                  <Text style={styles.annonceTitle}>{currentAnnonce.titre}</Text>
                  <Text numberOfLines={3} style={styles.annonceContent}>
                    {currentAnnonce.contenu}
                  </Text>
                  <Text style={styles.annonceDate}>
                    {currentAnnonce.createdAt.toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {!isLoadingAnnonces && hasMultipleAnnonces ? (
            <View style={styles.carouselFooter}>
              <View style={styles.carouselControls}>
                <Pressable
                  onPress={() => goToAnnonce(currentAnnonceIndex - 1)}
                  style={styles.carouselButton}
                >
                  <Text style={styles.carouselButtonText}>‹</Text>
                </Pressable>
                <Text style={styles.scrollHint}>
                  {currentAnnonceIndex + 1} / {annonces.length}
                </Text>
                <Pressable
                  onPress={() => goToAnnonce(currentAnnonceIndex + 1)}
                  style={styles.carouselButton}
                >
                  <Text style={styles.carouselButtonText}>›</Text>
                </Pressable>
              </View>
              <View style={styles.dots}>
                {annonces.map((annonce, index) => (
                  <View
                    key={annonce.id}
                    style={[
                      styles.dot,
                      index === currentAnnonceIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {canCreateAnnonce ? (
        <Pressable
          onPress={() => router.push('/create-annonce' as never)}
          style={styles.floatingButton}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: 16,
    maxWidth: 520,
    padding: 20,
    paddingBottom: 96,
    width: '100%',
  },
  appBar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: 12,
  },
  appBarBrand: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  appBarTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  profileButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
    width: 36,
  },
  notificationButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -4,
    top: -4,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  profileButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  header: {
    gap: 3,
    paddingBottom: 6,
    paddingTop: 4,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionMeta: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  sermonCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sermonMedia: {
    backgroundColor: colors.primary,
    height: 178,
    overflow: 'hidden',
  },
  sermonImage: {
    height: '100%',
    opacity: 0.82,
    width: '100%',
  },
  sermonImageShade: {
    backgroundColor: 'rgba(29, 53, 87, 0.42)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sermonMediaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  sermonBadge: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sermonDuration: {
    backgroundColor: 'rgba(29, 53, 87, 0.86)',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sermonMediaDate: {
    bottom: 12,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    left: 12,
    position: 'absolute',
  },
  sermonBody: {
    gap: 9,
    padding: 16,
  },
  sermonKicker: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sermonTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
  },
  sermonSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  listenButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 4,
  },
  listenButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  annonceCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  annonceCarousel: {
    overflow: 'hidden',
  },
  annonceItem: {
    backgroundColor: colors.surfaceContainerLowest,
    overflow: 'hidden',
  },
  annonceImage: {
    backgroundColor: colors.surfaceContainerHigh,
    height: 166,
    width: '100%',
  },
  annonceImageFallback: {
    alignItems: 'center',
    backgroundColor: colors.tertiary,
    height: 166,
    justifyContent: 'center',
    width: '100%',
  },
  annonceImageFallbackText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  annonceBody: {
    gap: 8,
    padding: 16,
  },
  annonceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  annonceTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
  },
  annonceContent: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  annonceDate: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  carouselFooter: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 12,
  },
  carouselControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  carouselButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  carouselButtonText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  scrollHint: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  dots: {
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'flex-end',
  },
  dot: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  activeDot: {
    backgroundColor: colors.secondary,
    width: 18,
  },
  floatingButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 28,
    bottom: 26,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    width: 56,
  },
  floatingButtonText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 32,
  },
})
