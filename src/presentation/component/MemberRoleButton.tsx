import { changeUserRoleUseCase, deleteAccountUseCase } from '@/composition/profil'
import { getAppRoleLabel, type ProfilModel } from '@/domain/entités/Profil'
import type { ManagedAppRole } from '@/domain/repositories/RoleAdminGateway'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { cacheCommunityMemberRole, cacheCurrentProfile, communityMembersQueryKey, currentProfileQueryKey } from '@/presentation/queries/profilQueries'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SymbolView } from 'expo-symbols'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'

type Props = {
  member: ProfilModel
  memberName: string
}

export function MemberRoleButton({ member, memberName }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false)
  const [selectedRole, setSelectedRole] = useState<ManagedAppRole>('membre')
  const queryClient = useQueryClient()
  const { data: actor, userId, isError } = useCurrentProfile()
  const canManage = !isError && (actor?.roleApp === 'admin' || actor?.roleApp === 'pasteur')
  const canChangeRole = canManage && member.roleApp !== 'pasteur'
  const isPastorAccount = member.roleApp === 'pasteur'
  const canDelete = canManage && !isPastorAccount && (
    actor?.roleApp === 'pasteur' || member.roleApp === 'membre'
  )
  const canInspectPastorAccount = !isError && actor?.roleApp === 'pasteur' && isPastorAccount
  const mutation = useMutation({
    mutationFn: (role: ManagedAppRole) => changeUserRoleUseCase.execute(member.id, role),
    onMutate: () => ({ userId }),
    onSuccess: async (data, role, context) => {
      await cacheCommunityMemberRole(queryClient, context?.userId ?? null, member.id, role)
      setIsOpen(false)
      const cached = queryClient.getQueryData<ProfilModel | null>(currentProfileQueryKey(member.id))
      if (cached) {
        await cacheCurrentProfile(queryClient, member.id, {
          ...cached, roleApp: role, isAdmin: role === 'admin',
        })
      }
      void queryClient.invalidateQueries({ queryKey: currentProfileQueryKey(member.id), exact: true })
      void queryClient.invalidateQueries({ queryKey: communityMembersQueryKey(context?.userId ?? null), exact: true })
    },
  })
  const deletion = useMutation({
    mutationFn: () => deleteAccountUseCase.execute(member.id),
    onMutate: () => ({ userId }),
    onSuccess: (_, __, context) => {
      setIsOpen(false)
      if (member.id === context?.userId) {
        router.replace('/(auth)/signin')
      } else {
        void queryClient.invalidateQueries({ queryKey: communityMembersQueryKey(context?.userId ?? null), exact: true })
      }
    },
  })
  const isBusy = mutation.isPending || deletion.isPending

  if (!canChangeRole && !canDelete && !canInspectPastorAccount) return null

  function openRolePicker() {
    mutation.reset()
    deletion.reset()
    setIsConfirmingDeletion(false)
    setSelectedRole(member.roleApp === 'admin' ? 'admin' : 'membre')
    setIsOpen(true)
  }

  function closeRolePicker() {
    if (!isBusy) setIsOpen(false)
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Gérer le compte de ${memberName}`}
        onPress={openRolePicker}
        style={styles.settingsButton}
      >
        <SymbolView
          name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
          size={18}
          tintColor={colors.primary}
        />
        <Text style={styles.settingsLabel}>{canDelete || canInspectPastorAccount ? 'Gérer' : 'Rôle'}</Text>
      </Pressable>
      <Modal
        animationType="fade"
        transparent
        visible={isOpen}
        onRequestClose={closeRolePicker}
      >
        <View style={styles.overlay}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.title}>{isConfirmingDeletion ? 'Supprimer le compte' : canDelete || canInspectPastorAccount ? 'Gérer le compte' : 'Attribuer un rôle'}</Text>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.currentRole}>Rôle actuel : {getAppRoleLabel(member.roleApp)}</Text>
            {canInspectPastorAccount ? (
              <Text accessibilityRole="alert" style={styles.error}>Le compte pasteur ne peut pas être supprimé.</Text>
            ) : null}
            {isConfirmingDeletion ? (
              <Text style={styles.currentRole}>Voulez-vous supprimer définitivement le compte de {memberName} ? Cette action est irréversible.{member.id === userId ? ' Vous serez déconnecté.' : ''}</Text>
            ) : canChangeRole ? <View style={styles.roleOptions}>
              {(['admin', 'membre'] as const).map((role) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedRole === role, disabled: isBusy }}
                  disabled={isBusy}
                  key={role}
                  onPress={() => setSelectedRole(role)}
                  style={[styles.roleOption, selectedRole === role && styles.roleSelected]}
                >
                  <Text style={[styles.roleText, selectedRole === role && styles.roleTextSelected]}>
                    {role === 'admin' ? 'Admin' : 'Membre'}
                  </Text>
                </Pressable>
              ))}
            </View> : null}
            {!isConfirmingDeletion && member.id === userId && selectedRole === 'membre' && member.roleApp === 'admin' ? (
              <Text style={styles.currentRole}>Vous perdrez vos droits d’administration.</Text>
            ) : null}
            {mutation.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{toErrorMessage(mutation.error, 'Impossible de modifier ce rôle.')}</Text> : null}
            {deletion.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{toErrorMessage(deletion.error, 'Impossible de supprimer ce compte.')}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" disabled={isBusy} onPress={() => {
                if (isConfirmingDeletion) {
                  setIsConfirmingDeletion(false)
                  deletion.reset()
                } else closeRolePicker()
              }} style={styles.cancelButton}>
                <Text style={styles.roleText}>Annuler</Text>
              </Pressable>
              {isConfirmingDeletion ? (
                <Pressable accessibilityRole="button" accessibilityState={{ disabled: isBusy, busy: deletion.isPending }} disabled={isBusy} onPress={() => deletion.mutate()} style={[styles.deleteButton, isBusy && styles.disabled]}>
                  {deletion.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.roleTextSelected}>Supprimer définitivement</Text>}
                </Pressable>
              ) : canChangeRole ? <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isBusy || selectedRole === member.roleApp, busy: mutation.isPending }}
                disabled={isBusy || selectedRole === member.roleApp}
                onPress={() => mutation.mutate(selectedRole)}
                style={[styles.saveButton, (isBusy || selectedRole === member.roleApp) && styles.disabled]}
              >
                {mutation.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.roleTextSelected}>Enregistrer</Text>}
              </Pressable> : null}
            </View>
            {canDelete && !isConfirmingDeletion ? (
              <Pressable accessibilityRole="button" disabled={isBusy} onPress={() => {
                mutation.reset()
                setIsConfirmingDeletion(true)
              }} style={[styles.deleteAccountButton, isBusy && styles.disabled]}>
                <Text style={styles.deleteAccountText}>Supprimer le compte</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  settingsButton: { minWidth: 64, minHeight: 44, flexShrink: 0, gap: 3, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.outline, backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 6 },
  settingsLabel: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(3, 31, 65, 0.42)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 380, borderRadius: 12, backgroundColor: colors.surfaceContainerLowest, padding: 20, gap: 12 },
  title: { color: colors.primary, fontSize: 20, fontWeight: '800' },
  memberName: { color: colors.onSurface, fontSize: 16, fontWeight: '700' },
  currentRole: { color: colors.onSurfaceVariant, fontSize: 13, lineHeight: 19 },
  roleOptions: { flexDirection: 'row', gap: 8 },
  roleOption: { flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center', padding: 8 },
  roleSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  roleTextSelected: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  dialogActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.surfaceContainer },
  saveButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.primary },
  disabled: { opacity: 0.5 },
  deleteButton: { flex: 1, minHeight: 44, padding: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.error },
  deleteAccountButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.error, marginTop: 4 },
  deleteAccountText: { color: colors.error, fontSize: 14, fontWeight: '700' },
  error: { color: colors.error, fontSize: 13, lineHeight: 19 },
})
