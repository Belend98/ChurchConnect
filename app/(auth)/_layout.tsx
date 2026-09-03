import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="signin" options={{ title: 'Connexion' }} />
      <Stack.Screen name="signup" options={{ title: 'Inscription' }} />
      <Stack.Screen name="profil" options = {{title: 'création du profil'}}/>
    </Stack>
  )
}
