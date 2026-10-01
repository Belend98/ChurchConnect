import { canManagePredications } from '@/domain/entités/Profil'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Alert } from 'react-native'

type UseRequirePredicationManagerOptions = {
  deniedMessage: string
  redirectTo?: string
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
    router.replace(redirectTo as never)
  }, [canAccessScreen, isCheckingAccess, isError, deniedMessage, redirectTo])

  return {
    canAccessScreen,
    isCheckingAccess,
  }
}
