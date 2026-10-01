import { profilService } from '@/composition/profil'
import { useCurrentSession } from '@/presentation/hooks/auth/useCurrentSession'
import { currentProfileQueryKey } from '@/presentation/queries/profilQueries'
import { useQuery } from '@tanstack/react-query'

export function useCurrentProfile() {
  const session = useCurrentSession()
  const userId = session?.user.id ?? null
  const query = useQuery({
    queryKey: currentProfileQueryKey(userId),
    queryFn: () => {
      if (!userId) throw new Error('Session invalide.')
      return profilService.getMyProfile(userId)
    },
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return { ...query, userId, email: session?.user.email, isSessionLoading: session === undefined }
}
