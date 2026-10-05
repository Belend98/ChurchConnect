import { authService } from '@/composition/Auth'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

export default function AccountAccessScreen() {
  const { data: profile, isPending, error } = useCurrentProfile()
  const signOut = useMutation({ mutationFn: () => authService.signOut() })
  useEffect(() => {
    if (profile?.statutAcces === 'accepte') router.replace('/')
  }, [profile?.statutAcces])

  return (
    <View style={styles.screen}>
      <View accessibilityRole="alert" style={styles.alert}>
        {isPending ? <ActivityIndicator color={colors.primary} /> : (
          <>
            <Text style={styles.title}>{error ? 'Accès indisponible' : profile?.statutAcces === 'refuse' ? 'Accès refusé' : 'Demande en attente'}</Text>
            <Text style={styles.message}>{error ? toErrorMessage(error) : profile?.statutAcces === 'refuse'
              ? 'Votre demande d’accès a été refusée. Contactez le pasteur ou un administrateur.'
              : 'Votre compte est en attente de la décision du pasteur ou d’un administrateur.'}</Text>
          </>
        )}
        {signOut.error && <Text style={styles.error}>{toErrorMessage(signOut.error)}</Text>}
        <Pressable accessibilityRole="button" disabled={signOut.isPending} onPress={() => signOut.mutate()}>
          <Text style={styles.message}>{signOut.isPending ? 'Déconnexion…' : 'Se déconnecter'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 },
  alert: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 24, gap: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  message: { color: colors.onSurfaceVariant, lineHeight: 24, textAlign: 'center' },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: colors.error },
})
