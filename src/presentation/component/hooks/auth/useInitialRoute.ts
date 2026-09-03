import { authService } from '@/composition/auth'
import { profilService } from '@/composition/profil'
import { router } from 'expo-router'
import { useEffect } from 'react'

export function useInitialRoute() {
  useEffect(() => {
    const handleInitialRedirect = async () => {
      try {
        const user = await authService.getCurrentUser()

        if (!user) {
          router.replace('/(auth)/signup')
          return
        }

        const profile = await profilService.getMyProfile(user.id)
        if (profile) {
          router.replace('/(tabs)/home')
        } else {
          router.replace('/(auth)/profil')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        router.replace('/(auth)/signup')
      }
    }

    void handleInitialRedirect()
  }, [])
}
