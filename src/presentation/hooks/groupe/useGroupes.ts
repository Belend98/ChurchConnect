import { groupeService } from '@/composition/groupe'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { groupeKeys } from '@/presentation/queries/groupeQueries'
import { useQuery } from '@tanstack/react-query'

export function useGroupes() {
  const userId = useCurrentUserId()

  return useQuery({
    queryKey: groupeKeys.list(userId),
    queryFn: () => groupeService.listGroupes(),
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
