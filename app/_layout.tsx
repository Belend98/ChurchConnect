import { Stack } from 'expo-router'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="create-groupe" />
          <Stack.Screen name="groupe-detail" />
          <Stack.Screen name="create-predication" />
          <Stack.Screen name="update-predication" />
          <Stack.Screen name="predication-player" />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
