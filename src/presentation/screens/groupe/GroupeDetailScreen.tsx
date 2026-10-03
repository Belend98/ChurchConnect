import { groupeService } from '@/composition/groupe'
import { messageGroupeService } from '@/composition/messageGroupe'
import { profilService } from '@/composition/profil'
import {
  canDeleteGroup as canDeleteGroupByRole,
  canManageGroup as canManageGroupByRole,
  canManageGroupMembers,
  getGroupRole,
  getGroupRoleLabel,
  isGroupCreator,
  type GroupeModel,
  type UpdateGroupeModel,
} from '@/domain/entités/Groupe'
import type { MessageGroupeModel } from '@/domain/entités/MessageGroupe'
import type { GroupeMembreModel } from '@/domain/entités/GroupeMember'
import type { ProfilModel } from '@/domain/entités/Profil'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { cacheGroupe, groupeKeys, removeCachedGroupe } from '@/presentation/queries/groupeQueries'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function getProfileName(profile: ProfilModel | undefined, userId: string | null) {
  if (userId === null) return 'Utilisateur supprimé'
  if (!profile) return `Membre ${userId.slice(0, 6)}`

  const fullName = [profile.prenom, profile.nom].filter(Boolean).join(' ')
  return fullName || profile.username || `Membre ${userId.slice(0, 6)}`
}

function formatMessageTime(date: Date) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function appendMessageUnique(
  items: MessageGroupeModel[],
  message: MessageGroupeModel,
) {
  if (items.some((item) => item.id === message.id)) return items

  return [...items, message].sort(
    (first, second) => first.createdAt.getTime() - second.createdAt.getTime(),
  )
}

export default function GroupeDetailScreen() {
  const params = useLocalSearchParams()
  const groupId = getParam(params.id)
  const groupName = getParam(params.name) || 'Groupe'
  const [addMemberError, setAddMemberError] = useState<string | null>(null)
  const currentUserId = useCurrentUserId()
  const queryClient = useQueryClient()
  const [editDescription, setEditDescription] = useState('')
  const [editName, setEditName] = useState('')
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<MessageGroupeModel[]>([])
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [username, setUsername] = useState('')

  const groupQuery = useQuery({
    queryKey: groupeKeys.detail(currentUserId, groupId),
    queryFn: () => groupeService.getGroupe(groupId),
    enabled: Boolean(currentUserId && groupId),
    staleTime: Infinity,
    initialData: () => {
      if (queryClient.getQueryState(groupeKeys.list(currentUserId))?.isInvalidated) return
      return queryClient.getQueryData<GroupeModel[]>(groupeKeys.list(currentUserId))
        ?.find((item) => item.id === groupId)
    },
  })
  const groupe = groupQuery.data ?? null
  const accessibleGroupId = currentUserId && groupe ? groupId : null
  const membersQuery = useQuery({
    queryKey: groupeKeys.members(currentUserId, groupId),
    queryFn: async () => {
      const members = await groupeService.listMembres(groupId)
      const profiles = await profilService.listProfilesByIds(
        members.map((member) => member.userId),
      )
      return {
        members,
        profiles: Object.fromEntries(profiles.map((profile) => [profile.id, profile])),
      }
    },
    enabled: Boolean(currentUserId && groupe),
    staleTime: Infinity,
  })
  const members = groupe ? membersQuery.data?.members ?? [] : []
  const memberProfiles = groupe ? membersQuery.data?.profiles ?? {} : {}
  const currentMembership = members.find((member) => member.userId === currentUserId)

  const addMemberMutation = useMutation({
    mutationFn: (username: string) => groupeService.addMembreByUsername(groupId, username),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: groupeKeys.members(currentUserId, groupId),
    }),
  })
  const updateMutation = useMutation({
    mutationFn: (data: UpdateGroupeModel) => groupeService.updateGroupe(groupId, data),
    onMutate: () => ({ userId: currentUserId, groupId }),
    onSuccess: async (groupe, _data, context) => {
      if (context?.userId !== currentUserId || context?.groupId !== groupId) return
      await Promise.all([
        queryClient.cancelQueries({ queryKey: groupeKeys.list(currentUserId) }),
        queryClient.cancelQueries({ queryKey: groupeKeys.detail(currentUserId, groupId) }),
      ])
      if (currentUserId) cacheGroupe(queryClient, currentUserId, groupe)
    },
  })
  const memberMutation = useMutation({
    mutationFn: async (action: { member: GroupeMembreModel; remove: boolean }) => {
      if (action.remove) await groupeService.removeMembre(action.member.id)
      else await groupeService.updateMembre(action.member.id, { isGroupAdmin: !action.member.isGroupAdmin })
    },
    onMutate: () => ({ userId: currentUserId, groupId }),
    onSuccess: (_data, action, context) => {
      if (context?.userId !== currentUserId || context?.groupId !== groupId) return
      void queryClient.invalidateQueries({ queryKey: groupeKeys.user(currentUserId) })
      if (action.member.userId === currentUserId && action.remove) {
        setIsSettingsOpen(false)
        router.back()
      }
    },
    onError: (error) => setSettingsError(toErrorMessage(error, 'Impossible de modifier ce membre.')),
  })
  async function removeFromCache() {
    await Promise.all([
      queryClient.cancelQueries({ queryKey: groupeKeys.list(currentUserId) }),
      queryClient.cancelQueries({ queryKey: groupeKeys.detail(currentUserId, groupId) }),
    ])
    if (currentUserId) removeCachedGroupe(queryClient, currentUserId, groupId)
  }
  const deleteMutation = useMutation({
    mutationFn: () => groupeService.deleteGroupe(groupId),
    onMutate: () => ({ userId: currentUserId, groupId }),
    onSuccess: (_data, _variables, context) => {
      if (context?.userId === currentUserId && context?.groupId === groupId) {
        return removeFromCache()
      }
    },
  })
  const leaveMutation = useMutation({
    mutationFn: (userId: string) => groupeService.removeMembreFromGroupe(groupId, userId),
    onMutate: () => ({ userId: currentUserId, groupId }),
    onSuccess: (_data, _variables, context) => {
      if (context?.userId === currentUserId && context?.groupId === groupId) {
        return removeFromCache()
      }
    },
  })
  const isAddingMember = addMemberMutation.isPending
  const isUpdating = updateMutation.isPending
  const isDeleting = deleteMutation.isPending
  const isLeaving = leaveMutation.isPending

  const loadMessages = useCallback(async () => {
    if (!accessibleGroupId) return

    setMessagesError(null)
    setIsLoadingMessages(true)

    try {
      const messageItems = await messageGroupeService.listMessages(accessibleGroupId)
      setMessages(messageItems)
    } catch (error) {
      console.warn(error)
      setMessages([])
      setMessagesError(toErrorMessage(error, 'Impossible de charger les messages.'))
    } finally {
      setIsLoadingMessages(false)
    }
  }, [accessibleGroupId, setMessagesError, setIsLoadingMessages, setMessages])

  useFocusEffect(
    useCallback(() => {
      void loadMessages()
    }, [loadMessages]),
  )

  useFocusEffect(
    useCallback(() => {
      if (!accessibleGroupId) return undefined

      const unsubscribe = messageGroupeService.subscribeToNewMessages(
        accessibleGroupId,
        (message) => {
          setMessages((currentMessages) =>
            appendMessageUnique(currentMessages, message),
          )
        },
      )

      return () => {
        unsubscribe()
      }
    }, [accessibleGroupId, setMessages]),
  )

  function manageMember(member: GroupeMembreModel, remove: boolean) {
    const profile = memberProfiles[member.userId]
    if (profile?.roleApp === 'pasteur' || isGroupCreator(groupe, member.userId)) return
    const name = getProfileName(profile, member.userId)
    const message = remove
      ? `Retirer ${name} du groupe ?`
      : `${member.isGroupAdmin ? 'Attribuer le rôle membre' : 'Attribuer le rôle administrateur'} à ${name} ?`
    const apply = () => {
      setSettingsError(null)
      memberMutation.mutate({ member, remove })
    }
    if (Platform.OS === 'web') {
      if (window.confirm(message)) apply()
    } else {
      Alert.alert(remove ? 'Retirer un membre' : 'Modifier le rôle', message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: apply },
      ])
    }
  }

  async function addMember() {
    const trimmedUsername = username.trim()

    setAddMemberError(null)

    if (!groupId) {
      setAddMemberError('Identifiant de groupe manquant.')
      return
    }

    if (!trimmedUsername) {
      setAddMemberError("Entre le nom d'utilisateur du membre.")
      return
    }

    try {
      await addMemberMutation.mutateAsync(trimmedUsername)
      setUsername('')
      setIsAddMemberOpen(false)
      Alert.alert('Membre ajouté', 'Le membre a été ajouté au groupe.')
    } catch (error) {
      setAddMemberError(toErrorMessage(error, 'Impossible d’ajouter ce membre.'))
    }
  }

  async function updateGroup() {
    const trimmedName = editName.trim()

    setSettingsError(null)

    if (!groupId) {
      setSettingsError('Identifiant de groupe manquant.')
      return
    }

    if (!trimmedName) {
      setSettingsError('Le nom du groupe est obligatoire.')
      return
    }

    try {
      await updateMutation.mutateAsync({
        description: editDescription.trim(),
        name: trimmedName,
      })

      Alert.alert(
        'Groupe modifié',
        'Les informations du groupe ont été mises à jour.',
      )
    } catch (error) {
      setSettingsError(toErrorMessage(error, 'Impossible de modifier ce groupe.'))
    }
  }

  function confirmDeleteGroup() {
    const title = groupe?.name ?? groupName

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Voulez-vous vraiment supprimer "${title}" ?`,
      )

      if (confirmed) void deleteGroup()
      return
    }

    Alert.alert(
      'Supprimer le groupe',
      `Voulez-vous vraiment supprimer "${title}" ?`,
      [
        { style: 'cancel', text: 'Annuler' },
        {
          onPress: () => deleteGroup(),
          style: 'destructive',
          text: 'Supprimer',
        },
      ],
    )
  }

  async function deleteGroup() {
    if (!groupId) {
      setSettingsError('Identifiant de groupe manquant.')
      return
    }

    setSettingsError(null)

    try {
      await deleteMutation.mutateAsync()
      setIsSettingsOpen(false)
      router.back()
    } catch (error) {
      setSettingsError(toErrorMessage(error, 'Impossible de supprimer ce groupe.'))
    }
  }

  function confirmLeaveGroup() {
    const title = groupe?.name ?? groupName

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Voulez-vous quitter "${title}" ?`)

      if (confirmed) void leaveGroup()
      return
    }

    Alert.alert('Quitter le groupe', `Voulez-vous quitter "${title}" ?`, [
      { style: 'cancel', text: 'Annuler' },
      {
        onPress: () => leaveGroup(),
        style: 'destructive',
        text: 'Quitter',
      },
    ])
  }

  async function leaveGroup() {
    if (!groupId || !currentUserId) {
      setSettingsError('Impossible de retrouver ton accès au groupe.')
      return
    }

    if (isGroupCreator(groupe, currentUserId)) {
      setSettingsError('Le créateur doit supprimer le groupe plutôt que le quitter.')
      return
    }

    setSettingsError(null)

    try {
      await leaveMutation.mutateAsync(currentUserId)
      setIsSettingsOpen(false)
      router.back()
    } catch (error) {
      setSettingsError(toErrorMessage(error, 'Impossible de quitter ce groupe.'))
    }
  }

  async function sendMessage() {
    const trimmedMessage = messageText.trim()

    setMessagesError(null)

    if (!groupId) {
      setMessagesError('Identifiant de groupe manquant.')
      return
    }

    if (!trimmedMessage) return

    setIsSendingMessage(true)

    try {
      const createdMessage = await messageGroupeService.createMessage(
        groupId,
        trimmedMessage,
      )

      setMessages((currentMessages) =>
        appendMessageUnique(currentMessages, createdMessage),
      )
      setMessageText('')
    } catch (error) {
      setMessagesError(toErrorMessage(error, 'Impossible d’envoyer ce message.'))
    } finally {
      setIsSendingMessage(false)
    }
  }

  const displayedGroupName = groupe?.name ?? groupName
  const canManageGroup = canManageGroupByRole(
    groupe,
    currentMembership,
    currentUserId,
  )
  const canManageMembers = canManageGroupMembers(
    groupe,
    currentMembership,
    currentUserId,
  )
  const canDeleteCurrentGroup = canDeleteGroupByRole(
    groupe, currentUserId,
    currentUserId ? memberProfiles[currentUserId]?.roleApp : undefined,
    currentMembership,
  )

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {displayedGroupName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>
            {displayedGroupName}
          </Text>
          <Text style={styles.subtitle}>{members.length} membre(s)</Text>
        </View>

        {canManageMembers ? (
          <Pressable
            onPress={() => setIsAddMemberOpen(true)}
            style={styles.headerIconButton}
          >
            <Text style={styles.headerIconText}>+</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => {
            setEditName(groupe?.name ?? groupName)
            setEditDescription(groupe?.description ?? '')
            setIsSettingsOpen(true)
          }}
          style={styles.headerIconButton}
        >
          <Text style={styles.headerIconText}>⚙</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        style={styles.messagesArea}
      >
        {groupQuery.isError || membersQuery.isError ? (
          <Text style={styles.errorText}>
            {toErrorMessage(groupQuery.error ?? membersQuery.error, 'Impossible de charger le groupe.')}
          </Text>
        ) : null}

        {groupQuery.isSuccess && !groupe ? (
          <Text style={styles.errorText}>Ce groupe n’est plus accessible.</Text>
        ) : null}

        {groupe && isLoadingMessages ? (
          <Text style={styles.messagesMeta}>Chargement des messages...</Text>
        ) : null}

        {groupe && !isLoadingMessages && messages.length === 0 ? (
          <Text style={styles.messagesMeta}>
            Aucun message pour le moment.
          </Text>
        ) : null}

        {(groupe ? messages : []).map((message) => {
          const isOwnMessage = message.userId !== null && message.userId === currentUserId
          const profile = message.userId === null ? undefined : memberProfiles[message.userId]

          return (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                isOwnMessage && styles.ownMessageBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageAuthor,
                  isOwnMessage && styles.ownMessageAuthor,
                ]}
              >
                {getProfileName(profile, message.userId)}
              </Text>
              <Text
                style={[
                  styles.messageContent,
                  isOwnMessage && styles.ownMessageContent,
                ]}
              >
                {message.contenu}
              </Text>
              <Text
                style={[
                  styles.messageTime,
                  isOwnMessage && styles.ownMessageTime,
                ]}
              >
                {formatMessageTime(message.createdAt)}
              </Text>
            </View>
          )
        })}

        {messagesError ? (
          <Text style={styles.errorText}>{messagesError}</Text>
        ) : null}
      </ScrollView>

      {canManageGroup ? (
        <View style={styles.composer}>
          <TextInput
            multiline
            onChangeText={setMessageText}
            placeholder="Message"
            placeholderTextColor={colors.outline}
            style={styles.input}
            value={messageText}
          />
          <Pressable
            disabled={isSendingMessage || !messageText.trim()}
            onPress={sendMessage}
            style={[
              styles.sendButton,
              (isSendingMessage || !messageText.trim()) &&
                styles.disabledButton,
            ]}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.readOnlyComposer}>
          <Text style={styles.readOnlyComposerText}>
            Seuls les créateurs et administrateurs peuvent écrire ici.
          </Text>
        </View>
      )}

      <Modal
        animationType="slide"
        onRequestClose={() => setIsAddMemberOpen(false)}
        transparent
        visible={isAddMemberOpen}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoidingView}
          >
            <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un membre</Text>
              <Pressable onPress={() => setIsAddMemberOpen(false)}>
                <Text style={styles.modalClose}>Fermer</Text>
              </Pressable>
            </View>

            <Text style={styles.modalText}>
              Entre le nom d’utilisateur du membre à ajouter au groupe.
            </Text>

            <TextInput
              autoCapitalize="none"
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={colors.outline}
              style={styles.memberInput}
              value={username}
            />

            {addMemberError ? (
              <Text style={styles.errorText}>{addMemberError}</Text>
            ) : null}

            <Pressable
              disabled={isAddingMember}
              onPress={addMember}
              style={[
                styles.confirmButton,
                isAddingMember && styles.disabledButton,
              ]}
            >
              <Text style={styles.confirmButtonText}>
                {isAddingMember ? 'Ajout...' : 'Ajouter au groupe'}
              </Text>
            </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsSettingsOpen(false)}
        transparent
        visible={isSettingsOpen}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoidingView}
          >
            <View style={styles.settingsCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paramètres</Text>
              <Pressable onPress={() => setIsSettingsOpen(false)}>
                <Text style={styles.modalClose}>Fermer</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.settingsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {canManageGroup ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Informations</Text>

                  <TextInput
                    onChangeText={setEditName}
                    placeholder="Nom du groupe"
                    placeholderTextColor={colors.outline}
                    style={styles.memberInput}
                    value={editName}
                  />

                  <TextInput
                    multiline
                    onChangeText={setEditDescription}
                    placeholder="Description"
                    placeholderTextColor={colors.outline}
                    style={[styles.memberInput, styles.descriptionInput]}
                    value={editDescription}
                  />

                  <Pressable
                    disabled={isUpdating}
                    onPress={updateGroup}
                    style={[
                      styles.confirmButton,
                      isUpdating && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.confirmButtonText}>
                      {isUpdating ? 'Modification...' : 'Modifier le groupe'}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Membres</Text>

                {members.map((member) => {
                  const profile = memberProfiles[member.userId]
                  const isCurrentUser = member.userId === currentUserId
                  const isPastor = profile?.roleApp === 'pasteur'
                  const canEditMember = canManageMembers && Boolean(profile) && !isPastor && !isGroupCreator(groupe, member.userId)

                  return (
                    <View key={member.id} style={styles.memberRow}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>
                          {getProfileName(profile, member.userId)
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.memberInfo}>
                        <Text numberOfLines={1} style={styles.memberName}>
                          {getProfileName(profile, member.userId)}
                          {isCurrentUser ? ' (vous)' : ''}
                        </Text>
                        <Text style={styles.memberRole}>
                          {isPastor ? 'Pasteur · Admin permanent' : getGroupRoleLabel(
                            getGroupRole(groupe, member, member.userId),
                          )}
                        </Text>
                        {canEditMember ? (
                          <View style={styles.memberActions}>
                            <Pressable accessibilityRole="button" disabled={memberMutation.isPending} onPress={() => manageMember(member, false)} style={styles.memberAction}>
                              <Text style={styles.memberActionText}>{member.isGroupAdmin ? 'Passer membre' : 'Nommer admin'}</Text>
                            </Pressable>
                            <Pressable accessibilityRole="button" disabled={memberMutation.isPending} onPress={() => manageMember(member, true)} style={styles.memberAction}>
                              <Text style={styles.dangerButtonText}>Retirer</Text>
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  )
                })}
              </View>

              {settingsError ? (
                <Text style={styles.errorText}>{settingsError}</Text>
              ) : null}

              {canDeleteCurrentGroup ? (
                <Pressable
                  disabled={isDeleting}
                  onPress={confirmDeleteGroup}
                  style={[
                    styles.dangerButton,
                    isDeleting && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.dangerButtonText}>
                    {isDeleting ? 'Suppression...' : 'Supprimer le groupe'}
                  </Text>
                </Pressable>
              ) : memberProfiles[currentUserId ?? '']?.roleApp !== 'pasteur' ? (
                <Pressable
                  disabled={isLeaving}
                  onPress={confirmLeaveGroup}
                  style={[
                    styles.dangerButton,
                    isLeaving && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.dangerButtonText}>
                    {isLeaving ? 'Sortie...' : 'Quitter le groupe'}
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  memberActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  memberAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  memberActionText: { color: colors.primary, fontWeight: '700' },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderBottomColor: colors.primary,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 14,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 32,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 36,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  headerText: {
    flex: 1,
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 250, 241, 0.14)',
    borderColor: 'rgba(255, 250, 241, 0.24)',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerIconText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 25,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#dce8f7',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    gap: 10,
    padding: 16,
  },
  messagesMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  messageBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    maxWidth: '84%',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ownMessageBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  messageAuthor: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  ownMessageAuthor: {
    color: '#dce8f7',
  },
  messageContent: {
    color: colors.onSurface,
    fontSize: 15,
    lineHeight: 21,
  },
  ownMessageContent: {
    color: '#ffffff',
  },
  messageTime: {
    alignSelf: 'flex-end',
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
  },
  ownMessageTime: {
    color: '#dce8f7',
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopColor: colors.surfaceContainerHigh,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  readOnlyComposer: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopColor: colors.surfaceContainerHigh,
    borderTopWidth: 1,
    padding: 12,
  },
  readOnlyComposerText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 22,
    borderWidth: 1,
    color: colors.onSurface,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
  modalOverlay: {
    backgroundColor: 'rgba(3, 31, 65, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalKeyboardAvoidingView: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
    padding: 18,
  },
  settingsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '86%',
    padding: 18,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  modalClose: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '900',
  },
  modalText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  settingsContent: {
    gap: 18,
    paddingTop: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  memberInput: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.onSurface,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  descriptionInput: {
    minHeight: 90,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  memberRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: colors.secondaryFixed,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  memberAvatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '900',
  },
  memberRole: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.error,
    borderRadius: 12,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
})
