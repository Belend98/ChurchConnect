import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { router } from 'expo-router'
import { useEffect } from 'react'

export function useInitialRoute() {
  const { data: profile, userId, isSessionLoading, isPending, isError } = useCurrentProfile()
  useEffect(() => {
    if (isSessionLoading || (userId && isPending)) return
    if (!userId) {
      router.replace('/(auth)/signup')
    } else {
      router.replace(isError || profile?.statutAcces !== 'accepte' ? '/account-access' : profile.username ? '/(tabs)/home' : '/(auth)/profil')
    }
  }, [profile, userId, isSessionLoading, isPending, isError])
}
