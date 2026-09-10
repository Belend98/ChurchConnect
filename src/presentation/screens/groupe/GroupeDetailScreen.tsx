import { authService } from '@/composition/Auth'
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
} from '@/domain/entités/Groupe'
import type { GroupeMembreModel } from '@/domain/entités/GroupeMember'
import type { MessageGroupeModel } from '@/domain/entités/MessageGroupe'
import type { ProfilModel } from '@/domain/entités/Profil'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert,
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

function getProfileName(profile: ProfilModel | undefined, userId: string) {
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editName, setEditName] = useState('')
  const [groupe, setGroupe] = useState<GroupeModel | null>(null)
  const [currentMembership, setCurrentMembership] =
    useState<GroupeMembreModel | null>(null)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [memberProfiles, setMemberProfiles] = useState<
    Record<string, ProfilModel>
  >({})
  const [members, setMembers] = useState<GroupeMembreModel[]>([])
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<MessageGroupeModel[]>([])
  const [messagesError, setMessagesError] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [username, setUsername] = useState('')

  const loadGroupContext = useCallback(async () => {
    if (!groupId) return

    const [groupeItem, user, memberItems] = await Promise.all([
      groupeService.getGroupe(groupId),
      authService.getCurrentUser(),
      groupeService.listMembres(groupId),
    ])

    const profiles = await profilService.listProfilesByIds(
      memberItems.map((member) => member.userId),
    )
    const profileById = profiles.reduce<Record<string, ProfilModel>>(
      (acc, profile) => {
        acc[profile.id] = profile
        return acc
      },
      {},
    )
    const currentMembership = memberItems.find(
      (member) => member.userId === user?.id,
    )

    setCurrentUserId(user?.id ?? null)
    setGroupe(groupeItem)
    setEditName(groupeItem?.name ?? groupName)
    setEditDescription(groupeItem?.description ?? '')
    setMembers(memberItems)
    setMemberProfiles(profileById)
    setCurrentMembership(currentMembership ?? null)
  }, [groupId, groupName])

  const loadMessages = useCallback(async () => {
    if (!groupId) return

    setMessagesError(null)
    setIsLoadingMessages(true)

    try {
      const messageItems = await messageGroupeService.listMessages(groupId)
      setMessages(messageItems)
    } catch (error) {
      console.warn(error)
      setMessages([])
      setMessagesError(toErrorMessage(error, 'Impossible de charger les messages.'))
    } finally {
      setIsLoadingMessages(false)
    }
  }, [groupId])

  useFocusEffect(
    useCallback(() => {
      let isMounted = true

      loadGroupContext().catch((error) => {
        if (!isMounted) return
        console.warn(error)
        setGroupe(null)
        setCurrentMembership(null)
        setMembers([])
        setMemberProfiles({})
      })
      loadMessages()

      return () => {
        isMounted = false
      }
    }, [loadGroupContext, loadMessages]),
  )

  useFocusEffect(
    useCallback(() => {
      if (!groupId) return undefined

      const unsubscribe = messageGroupeService.subscribeToNewMessages(
        groupId,
        (message) => {
          setMessages((currentMessages) =>
            appendMessageUnique(currentMessages, message),
          )
        },
      )

      return () => {
        unsubscribe()
      }
    }, [groupId]),
  )

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

    setIsAddingMember(true)

    try {
      await groupeService.addMembreByUsername(groupId, trimmedUsername)
      await loadGroupContext()
      setUsername('')
      setIsAddMemberOpen(false)
      Alert.alert('Membre ajouté', 'Le membre a été ajouté au groupe.')
    } catch (error) {
      setAddMemberError(toErrorMessage(error, 'Impossible d’ajouter ce membre.'))
    } finally {
      setIsAddingMember(false)
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

    setIsUpdating(true)

    try {
      const updatedGroupe = await groupeService.updateGroupe(groupId, {
        description: editDescription.trim() || undefined,
        name: trimmedName,
      })

      setGroupe(updatedGroupe)
      Alert.alert(
        'Groupe modifié',
        'Les informations du groupe ont été mises à jour.',
      )
    } catch (error) {
      setSettingsError(toErrorMessage(error, 'Impossible de modifier ce groupe.'))
    } finally {
      setIsUpdating(false)
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

    setIsDeleting(true)
    setSettingsError(null)

    try {
      await groupeService.deleteGroupe(groupId)
      setIsSettingsOpen(false)
      router.back()
    } catch (error) {
      setSettingsError(toErrorMessage(error, 'Impossible de supprimer ce groupe.'))
    } finally {
      setIsDeleting(false)
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

    setIsLeaving(true)
    setSettingsError(null)

    try {
      await groupeService.removeMembreFromGroupe(groupId, currentUserId)
      setIsSettingsOpen(false)
      router.back()
    } catch (error) {
      setSettingsError(toErrorMessage(error, 'Impossible de quitter ce groupe.'))
    } finally {
      setIsLeaving(false)
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
  const canDeleteCurrentGroup = canDeleteGroupByRole(groupe, currentUserId)

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
          onPress={() => setIsSettingsOpen(true)}
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
        {isLoadingMessages ? (
          <Text style={styles.messagesMeta}>Chargement des messages...</Text>
        ) : null}

        {!isLoadingMessages && messages.length === 0 ? (
          <Text style={styles.messagesMeta}>
            Aucun message pour le moment.
          </Text>
        ) : null}

        {messages.map((message) => {
          const isOwnMessage = message.userId === currentUserId
          const profile = memberProfiles[message.userId]

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
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsSettingsOpen(false)}
        transparent
        visible={isSettingsOpen}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.settingsCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paramètres</Text>
              <Pressable onPress={() => setIsSettingsOpen(false)}>
                <Text style={styles.modalClose}>Fermer</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.settingsContent}
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
                          {getGroupRoleLabel(
                            getGroupRole(groupe, member, member.userId),
                          )}
                        </Text>
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
              ) : (
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
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
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
