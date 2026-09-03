import { authService } from '@/composition/auth'
import { userService } from '@/composition/user'
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

        const profile = await userService.getMyProfile(user.id)
        if (profile) {
          router.replace('/(tabs)/home')
        } else {
          router.replace('/')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error)
        router.replace('/(auth)/signup')
      }
    }

    void handleInitialRedirect()
  }, [])
}
