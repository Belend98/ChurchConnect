import { profilService } from '@/composition/profil'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { communityMembersQueryKey } from '@/presentation/queries/profilQueries'
import { useQuery } from '@tanstack/react-query'

export function useCommunityMembers() {
  const userId = useCurrentUserId()
  return useQuery({
    queryKey: communityMembersQueryKey(userId),
    queryFn: () => profilService.listCommunityMembers(),
    enabled: Boolean(userId),
    staleTime: 30_000,
  })
}
