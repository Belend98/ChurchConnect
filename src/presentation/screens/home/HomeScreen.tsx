import { annonceService } from '@/composition/annonce'
import { MemberRoleButton } from '@/presentation/component/MemberRoleButton'
import { ListCount } from '@/presentation/component/ListCount'
import {
  canManagePredications,
  getAppRoleLabel,
  type ProfilModel,
} from '@/domain/entités/Profil'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { useNotifications } from '@/presentation/hooks/notification/useNotifications'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { useCommunityMembers } from '@/presentation/hooks/profil/useCommunityMembers'
import { annoncesQueryKey, applyAnnonceChange } from '@/presentation/queries/annonceQueries'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useFocusEffect } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

function getMemberDisplayName(member: ProfilModel) {
  const fullName = [member.prenom, member.nom].filter(Boolean).join(' ')

  return fullName || member.username || 'Membre'
}

function normalizeMemberSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR')
}

const memberRoleFilters = [
  { value: 'all', label: 'Tous' },
  { value: 'admin', label: 'Admins' },
  { value: 'membre', label: 'Membres' },
] as const

type MemberRoleFilter = (typeof memberRoleFilters)[number]['value']

export default function HomeScreen() {
  const userId = useCurrentUserId()
  const queryClient = useQueryClient()
  const [annonceActionError, setAnnonceActionError] = useState<string | null>(null)
  const deleteAnnonceMutation = useMutation({
    mutationFn: (id: string) => annonceService.deleteAnnonce(id),
    onMutate: () => ({ userId }),
    onSuccess: (_result, id, context) => {
      if (!context?.userId || context.userId !== userId) return
      return applyAnnonceChange(queryClient, userId, { type: 'delete', id })
    },
  })
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
  const { data: profile, isError: isProfileError, refetch: refetchProfile } = useCurrentProfile()
  const canCreateAnnonce = !isProfileError && profile?.statutAcces === 'accepte' && canManagePredications(profile.roleApp)
  const canFilterMembers = !isProfileError && (profile?.roleApp === 'pasteur' || profile?.roleApp === 'admin')
  const { unreadCount: notificationUnreadCount } = useNotifications()
  const {
    data: communityMembers = [],
    isPending: isLoadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useCommunityMembers()
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState<MemberRoleFilter>('all')

  const searchTerms = normalizeMemberSearch(memberSearch).trim().split(/\s+/).filter(Boolean)
  const visibleMembers = communityMembers.filter((member) => {
    if (canFilterMembers && memberRoleFilter !== 'all' && member.roleApp !== memberRoleFilter) return false
    const searchableName = normalizeMemberSearch(
      [member.prenom, member.nom, member.username].filter(Boolean).join(' '),
    )
    return searchTerms.every((term) => searchableName.includes(term.replace(/^@/, '')))
  })

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      void refetchProfile()
      void refetchMembers()
    }, [userId, refetchProfile, refetchMembers]),
  )

  const visibleAnnonceIndex = Math.min(currentAnnonceIndex, Math.max(annonces.length - 1, 0))
  const currentAnnonce = annonces[visibleAnnonceIndex]
  const hasMultipleAnnonces = annonces.length > 1

  function goToAnnonce(index: number) {
    if (annonces.length === 0) return

    const nextIndex = (index + annonces.length) % annonces.length
    setCurrentAnnonceIndex(nextIndex)
  }

  async function deleteAnnonce(id: string) {
    setAnnonceActionError(null)
    try {
      await deleteAnnonceMutation.mutateAsync(id)
    } catch (error) {
      setAnnonceActionError(toErrorMessage(error, "Impossible de supprimer l'annonce."))
    }
  }

  function confirmDeleteAnnonce() {
    if (!currentAnnonce || !canCreateAnnonce || deleteAnnonceMutation.isPending) return
    const { id, titre } = currentAnnonce
    const message = `Voulez-vous supprimer « ${titre} » ?`
    if (Platform.OS === 'web') {
      if (window.confirm(message)) void deleteAnnonce(id)
      return
    }
    Alert.alert('Supprimer l’annonce', message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => void deleteAnnonce(id) },
    ])
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications' as never)}
            style={styles.notificationButton}
          >
            <SymbolView
              name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
              size={20}
              tintColor={colors.primary}
            />
            {notificationUnreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Annonce</Text>
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
                <View style={styles.annonceBody}>
                  <Text style={styles.annonceBadge}>Vie communautaire</Text>
                  <Text style={styles.annonceTitle}>{currentAnnonce.titre}</Text>
                  <Text numberOfLines={3} style={styles.annonceContent}>
                    {currentAnnonce.contenu}
                  </Text>
                  <Text style={styles.annonceDate}>
                    {currentAnnonce.createdAt.toLocaleDateString('fr-FR')}
                  </Text>
                  {canCreateAnnonce ? (
                    <View style={styles.annonceActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={deleteAnnonceMutation.isPending}
                        onPress={() => router.push({ pathname: '/create-annonce', params: { id: currentAnnonce.id } } as never)}
                        style={styles.annonceActionButton}
                      >
                        <Text style={styles.annonceActionText}>Modifier</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={deleteAnnonceMutation.isPending}
                        onPress={confirmDeleteAnnonce}
                        style={styles.annonceActionButton}
                      >
                        <Text style={styles.annonceDeleteText}>{deleteAnnonceMutation.isPending ? 'Suppression...' : 'Supprimer'}</Text>
                      </Pressable>
                    </View>
                  ) : null}
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

        {annonceActionError ? <Text accessibilityRole="alert" style={styles.membersError}>{annonceActionError}</Text> : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membres de la communauté</Text>
          {!isLoadingMembers && !membersError ? <ListCount count={visibleMembers.length} label="membres affichés" /> : null}
        </View>

        <View style={styles.membersCard}>
          <View style={styles.memberFilters}>
            <View style={styles.memberSearchBox}>
              <TextInput
                accessibilityLabel="Rechercher un membre par nom ou nom d’utilisateur"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setMemberSearch}
                placeholder="Nom ou @pseudo"
                placeholderTextColor={colors.onSurfaceVariant}
                returnKeyType="search"
                style={styles.memberSearchInput}
                value={memberSearch}
              />
              {memberSearch ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Effacer la recherche"
                  onPress={() => setMemberSearch('')}
                  style={styles.clearMemberSearch}
                >
                  <Text style={styles.clearMemberSearchText}>×</Text>
                </Pressable>
              ) : null}
            </View>
            {canFilterMembers ? <View style={styles.memberRoleFilters}>
              {memberRoleFilters.map((filter) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: memberRoleFilter === filter.value }}
                  key={filter.value}
                  onPress={() => setMemberRoleFilter(filter.value)}
                  style={[styles.memberFilterButton, memberRoleFilter === filter.value && styles.memberFilterActive]}
                >
                  <Text style={[styles.memberFilterText, memberRoleFilter === filter.value && styles.memberFilterTextActive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View> : null}
          </View>

          {isLoadingMembers ? <ActivityIndicator color={colors.primary} /> : null}

          {membersError ? (
            <View>
              <Text style={styles.membersError}>{toErrorMessage(membersError, 'Impossible de charger les membres.')}</Text>
              <Pressable accessibilityRole="button" onPress={() => void refetchMembers()} style={styles.memberFilterButton}>
                <Text style={styles.memberFilterText}>Réessayer</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoadingMembers && !membersError && visibleMembers.length === 0 ? (
            <Text style={styles.sermonSubtitle}>
              {communityMembers.length === 0 ? 'Aucun membre trouvé pour le moment.' : 'Aucun membre ne correspond à votre recherche.'}
            </Text>
          ) : null}

          {visibleMembers.map((member) => {
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
                {canFilterMembers ? (
                  <MemberRoleButton
                    member={member}
                    memberName={memberName}
                  />
                ) : null}
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
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    flexShrink: 1,
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
  annonceActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  annonceActionButton: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  annonceActionText: { color: colors.primary, fontWeight: '700' },
  annonceDeleteText: { color: colors.error, fontWeight: '700' },
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
  membersError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  memberFilters: {
    gap: 8,
    borderBottomColor: colors.surfaceContainerHigh,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  memberSearchBox: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.outline,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
  },
  memberSearchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.onSurface,
    fontSize: 14,
  },
  clearMemberSearch: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    width: 44,
  },
  clearMemberSearchText: {
    color: colors.onSurfaceVariant,
    fontSize: 24,
  },
  memberRoleFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberFilterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
  },
  memberFilterActive: {
    backgroundColor: colors.primary,
  },
  memberFilterText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  memberFilterTextActive: {
    color: '#ffffff',
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
    minWidth: 0,
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
