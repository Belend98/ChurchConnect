import { profilService } from '@/composition/profil'
import { canManagePredications } from '@/domain/entités/Profil'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'

type UseRequirePredicationManagerOptions = {
  deniedMessage: string
  redirectTo?: string
}

export function useRequirePredicationManager({
  deniedMessage,
  redirectTo = '/(tabs)/predication',
}: UseRequirePredicationManagerOptions) {
  const [canAccessScreen, setCanAccessScreen] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function checkAccess() {
      try {
        const profile = await profilService.getCurrentUserProfileOrThrow()
        const canManage = canManagePredications(profile.roleApp)

        if (!isMounted) return

        setCanAccessScreen(canManage)

        if (!canManage) {
          Alert.alert('Accès refusé', deniedMessage)
          router.replace(redirectTo as never)
        }
      } catch (error) {
        if (!isMounted) return

        console.warn(error)
        setCanAccessScreen(false)
        Alert.alert('Accès refusé', 'Impossible de vérifier tes droits.')
        router.replace(redirectTo as never)
      } finally {
        if (isMounted) setIsCheckingAccess(false)
      }
    }

    checkAccess()

    return () => {
      isMounted = false
    }
  }, [deniedMessage, redirectTo])

  return {
    canAccessScreen,
    isCheckingAccess,
  }
}
