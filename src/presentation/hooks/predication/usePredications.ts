import { predicationService } from '@/composition/predication'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { PREDICATIONS_QUERY_KEY } from '@/presentation/queries/predicationQueries'
import { useQuery } from '@tanstack/react-query'

export function usePredications() {
  const userId = useCurrentUserId()

  return useQuery({
    queryKey: PREDICATIONS_QUERY_KEY,
    queryFn: () => predicationService.listPredications(),
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
