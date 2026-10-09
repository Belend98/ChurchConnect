import { canManagePredications } from '@/domain/entities/Profil'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { router, type Href } from 'expo-router'
import { useEffect } from 'react'
import { Alert } from 'react-native'

type UseRequirePredicationManagerOptions = {
  deniedMessage: string
  redirectTo?: Href
}

export function useRequirePredicationManager({
  deniedMessage,
  redirectTo = '/(tabs)/predication',
}: UseRequirePredicationManagerOptions) {
  const { data: profile, isPending, isSessionLoading, userId, isError } = useCurrentProfile()
  const isCheckingAccess = isSessionLoading || Boolean(userId && isPending)
  const canAccessScreen = !isError && Boolean(userId) && canManagePredications(profile?.roleApp)

  useEffect(() => {
    if (isCheckingAccess || canAccessScreen) return
    Alert.alert('Accès refusé', isError ? 'Impossible de vérifier tes droits.' : deniedMessage)
    router.replace(redirectTo)
  }, [canAccessScreen, isCheckingAccess, isError, deniedMessage, redirectTo])

  return {
    canAccessScreen,
    isCheckingAccess,
  }
}
