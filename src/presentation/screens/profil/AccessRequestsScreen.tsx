import { useAccessRequests } from '@/presentation/hooks/profil/useAccessRequests'
import { useRejectedMembers } from '@/presentation/hooks/profil/useRejectedMembers'
import { useState } from 'react'
import type { ProfilModel } from '@/domain/entités/Profil'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function AccessRequestsScreen() {
  const [filter, setFilter] = useState<'en_attente' | 'refuse'>('en_attente')
  const [memberToDelete, setMemberToDelete] = useState<ProfilModel | null>(null)
  const pendingQuery = useAccessRequests()
  const rejectedQuery = useRejectedMembers()
  const { data: requests = [], isPending, error, refetch } = filter === 'refuse' ? rejectedQuery : pendingQuery
  const { decision } = pendingQuery
  const { deletion, canDeleteMember } = rejectedQuery
  const isBusy = decision.isPending || deletion.isPending
  if (!pendingQuery.canManage || !rejectedQuery.canManage) return null

  function changeFilter(next: 'en_attente' | 'refuse') {
    decision.reset()
    deletion.reset()
    setFilter(next)
  }

  function closeDeletion() {
    if (deletion.isPending) return
    setMemberToDelete(null)
    deletion.reset()
  }

  return (
    <>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Demandes d’accès</Text>
      <Text style={styles.description}>{filter === 'refuse'
        ? 'Accepte une inscription refusée ou supprime définitivement le compte.'
        : 'Accepte ou refuse les nouvelles inscriptions.'}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={isBusy} accessibilityState={{ selected: filter === 'en_attente', disabled: isBusy }}
          style={[styles.filter, filter === 'en_attente' && styles.selectedFilter]}
          onPress={() => changeFilter('en_attente')}>
          <Text style={styles.description}>En attente</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={isBusy} accessibilityState={{ selected: filter === 'refuse', disabled: isBusy }}
          style={[styles.filter, filter === 'refuse' && styles.selectedFilter]}
          onPress={() => changeFilter('refuse')}>
          <Text style={styles.description}>Refusés</Text>
        </Pressable>
      </View>
      {isPending && <ActivityIndicator color={colors.primary} />}
      {error && (
        <View>
          <Text style={styles.error}>{toErrorMessage(error)}</Text>
          <Pressable onPress={() => void refetch()}><Text style={styles.description}>Réessayer</Text></Pressable>
        </View>
      )}
      {decision.error && <Text accessibilityRole="alert" style={styles.error}>{toErrorMessage(decision.error)}</Text>}
      {!isPending && !error && requests.length === 0 && <Text style={styles.description}>
        {filter === 'refuse' ? 'Aucun membre refusé.' : 'Aucune demande en attente.'}
      </Text>}
      {!error && requests.map((member) => (
        <View key={member.id} style={styles.card}>
          <Text style={styles.name}>{[member.prenom, member.nom].filter(Boolean).join(' ') || member.username || 'Nouveau membre'}</Text>
          <Text style={styles.description}>Inscription du {member.createdAt.toLocaleDateString('fr-FR')}</Text>
          {filter === 'refuse' && <Text style={styles.description}>Accès refusé</Text>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={isBusy}
              style={[styles.button, isBusy && styles.disabled]}
              onPress={() => decision.mutate({ id: member.id, accepted: true })}>
              <Text style={styles.buttonText}>{decision.isPending && decision.variables?.id === member.id && decision.variables.accepted ? 'Acceptation...' : 'Accepter'}</Text>
            </Pressable>
            {filter === 'en_attente' ? <Pressable accessibilityRole="button" disabled={isBusy}
              style={[styles.button, styles.refuse, isBusy && styles.disabled]}
              onPress={() => decision.mutate({ id: member.id, accepted: false })}>
              <Text style={styles.buttonText}>{decision.isPending && decision.variables?.id === member.id && !decision.variables.accepted ? 'Refus...' : 'Refuser'}</Text>
            </Pressable> : canDeleteMember(member) ? <Pressable accessibilityRole="button" disabled={isBusy}
              style={[styles.button, styles.refuse, isBusy && styles.disabled]}
              onPress={() => { deletion.reset(); setMemberToDelete(member) }}>
              <Text style={styles.buttonText}>Supprimer le compte</Text>
            </Pressable> : null}
          </View>
        </View>
      ))}
    </ScrollView>
    <Modal transparent animationType="fade" visible={Boolean(memberToDelete)} onRequestClose={closeDeletion}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text accessibilityRole="header" style={styles.title}>Supprimer le compte</Text>
          <Text style={styles.name}>{memberToDelete && ([memberToDelete.prenom, memberToDelete.nom].filter(Boolean).join(' ') || memberToDelete.username || 'Nouveau membre')}</Text>
          <Text style={styles.description}>Le compte et ses données personnelles seront supprimés définitivement. Cette action est irréversible.</Text>
          {deletion.error && <Text accessibilityRole="alert" style={styles.error}>{toErrorMessage(deletion.error, 'Impossible de supprimer ce compte.')}</Text>}
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" disabled={isBusy} onPress={closeDeletion} style={[styles.filter, isBusy && styles.disabled]}>
              <Text style={styles.description}>Annuler</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={isBusy || !memberToDelete || !canDeleteMember(memberToDelete)}
              style={[styles.button, styles.refuse, isBusy && styles.disabled]}
              onPress={() => {
                if (memberToDelete && !isBusy) deletion.mutate(memberToDelete, { onSuccess: () => setMemberToDelete(null) })
              }}>
              <Text style={styles.buttonText}>{deletion.isPending ? 'Suppression...' : 'Supprimer définitivement'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '700', color: colors.primary },
  description: { color: colors.onSurfaceVariant, lineHeight: 22 },
  error: { color: colors.error },
  card: { backgroundColor: colors.surfaceContainerLowest, padding: 18, borderRadius: 16, gap: 12 },
  name: { color: colors.onSurface, fontSize: 18, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(3, 31, 65, 0.42)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 440, backgroundColor: colors.surfaceContainerLowest, padding: 20, borderRadius: 16, gap: 16 },
  filter: { borderWidth: 1, borderColor: colors.outline, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  selectedFilter: { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.primary },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 18 },
  refuse: { backgroundColor: colors.error },
  buttonText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
})
