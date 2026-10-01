import { annonceService } from '@/composition/annonce'
import { profilService } from '@/composition/profil'
import {
  canManagePredications,
  getAppRoleLabel,
  type ProfilModel,
} from '@/domain/entités/Profil'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { useNotifications } from '@/presentation/hooks/notification/useNotifications'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { annoncesQueryKey } from '@/presentation/queries/annonceQueries'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { useQuery } from '@tanstack/react-query'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

function getMemberDisplayName(member: ProfilModel) {
  const fullName = [member.prenom, member.nom].filter(Boolean).join(' ')

  return fullName || member.username || 'Membre'
}

export default function HomeScreen() {
  const userId = useCurrentUserId()
  const {
    data: annonces = [],
    isPending: isLoadingAnnonces,
    isError: isAnnoncesError,
    error: annoncesError,
    refetch: refetchAnnonces,
  } = useQuery({
    queryKey: annoncesQueryKey(userId),
    queryFn: () => annonceService.listAnnonces(),
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const [currentAnnonceIndex, setCurrentAnnonceIndex] = useState(0)
  const { data: profile, isError: isProfileError } = useCurrentProfile()
  const canCreateAnnonce = !isProfileError && canManagePredications(profile?.roleApp)
  const profileName = profile?.prenom ?? profile?.username ?? null
  const { unreadCount: notificationUnreadCount } = useNotifications()
  const [communityMembers, setCommunityMembers] = useState<ProfilModel[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      setIsLoadingMembers(true)

      profilService
        .listCommunityMembers()
        .then((members) => {
          if (!isMounted) return
          setCommunityMembers(members)
        })
        .catch((error) => {
          if (!isMounted) return
          console.warn(error)
          setCommunityMembers([])
        })
        .finally(() => {
          if (isMounted) setIsLoadingMembers(false)
        })

      return () => {
        isMounted = false
      }
    }, []),
  )

  const visibleAnnonceIndex = Math.min(currentAnnonceIndex, Math.max(annonces.length - 1, 0))
  const currentAnnonce = annonces[visibleAnnonceIndex]
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Annonces</Text>
        </View>

        <View style={styles.annonceCard}>
          {isLoadingAnnonces ? <ActivityIndicator color={colors.primary} /> : null}

          {isAnnoncesError ? (
            <View>
              <Text style={styles.sermonSubtitle}>
                {toErrorMessage(annoncesError, 'Impossible de charger les annonces.')}
              </Text>
              <Pressable onPress={() => void refetchAnnonces()}>
                <Text style={styles.sermonSubtitle}>Réessayer</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoadingAnnonces && !isAnnoncesError && annonces.length === 0 ? (
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
                  onPress={() => goToAnnonce(visibleAnnonceIndex - 1)}
                  style={styles.carouselButton}
                >
                  <Text style={styles.carouselButtonText}>‹</Text>
                </Pressable>
                <Text style={styles.scrollHint}>
                  {visibleAnnonceIndex + 1} / {annonces.length}
                </Text>
                <Pressable
                  onPress={() => goToAnnonce(visibleAnnonceIndex + 1)}
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
                      index === visibleAnnonceIndex && styles.activeDot,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membres de la communauté</Text>
        </View>

        <View style={styles.membersCard}>
          {!isLoadingMembers && communityMembers.length === 0 ? (
            <Text style={styles.sermonSubtitle}>
              Aucun membre trouvé pour le moment.
            </Text>
          ) : null}

          {communityMembers.map((member) => {
            const memberName = getMemberDisplayName(member)

            return (
              <View key={member.id} style={styles.memberRow}>
                {member.imageUrl ? (
                  <Image
                    source={{ uri: member.imageUrl }}
                    style={styles.memberAvatarImage}
                  />
                ) : (
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {memberName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text numberOfLines={1} style={styles.memberName}>
                    {memberName}
                  </Text>
                  <Text numberOfLines={1} style={styles.memberMeta}>
                    @{member.username ?? 'profil'} · {getAppRoleLabel(member.roleApp)}
                  </Text>
                </View>
              </View>
            )
          })}
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
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  sermonSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
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
  membersCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    minHeight: 54,
  },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  memberAvatarImage: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  memberAvatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  memberInfo: {
    flex: 1,
    gap: 3,
  },
  memberName: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  memberMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
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
