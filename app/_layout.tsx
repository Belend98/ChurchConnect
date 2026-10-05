import { useCurrentSession } from '@/presentation/hooks/auth/useCurrentSession'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { tanstack } from '@/infrastructure/tanstack/client'
import { RealtimeSync } from '@/presentation/providers/RealtimeSync'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={tanstack}>
        <RealtimeSync />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <AppNavigator />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

function AppNavigator() {
  const session = useCurrentSession()
  const { data: profile } = useCurrentProfile()
  const accepted = profile?.statutAcces === 'accepte'
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={session !== undefined && (!session || accepted)}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && !accepted}>
        <Stack.Screen name="account-access" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && accepted && Boolean(profile?.username)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create-annonce" />
        <Stack.Screen name="create-groupe" />
        <Stack.Screen name="groupe-detail" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="create-predication" />
        <Stack.Screen name="update-predication" />
        <Stack.Screen name="predication-player" />
      </Stack.Protected>
    </Stack>
  )
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
})
