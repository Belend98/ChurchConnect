import { useSupabaseAuthRedirect } from '@/presentation/hooks/auth/useSupabaseAuthRedirect'
import { tanstack } from '@/infrastructure/tanstack/client'
import { RealtimeSync } from '@/presentation/providers/RealtimeSync'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

export default function RootLayout() {
  useSupabaseAuthRedirect()

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={tanstack}>
        <RealtimeSync />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="auth-callback" />
              <Stack.Screen name="create-annonce" />
              <Stack.Screen name="create-groupe" />
              <Stack.Screen name="groupe-detail" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="create-predication" />
              <Stack.Screen name="update-predication" />
              <Stack.Screen name="predication-player" />
            </Stack>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
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
