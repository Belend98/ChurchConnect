import { predicationService } from '@/composition/predication'
import type { PredicationModel } from '@/domain/entities/Predication'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { predicationLikeKey, type PredicationLikes } from '@/presentation/queries/predicationQueries'
import { useQueries } from '@tanstack/react-query'

export function usePredicationLikes(predications: PredicationModel[]) {
  const userId = useCurrentUserId()
  const queries = useQueries({
    queries: predications.map((predication) => ({
      queryKey: predicationLikeKey(userId, predication.id),
      queryFn: async ({ signal }: { signal: AbortSignal }): Promise<PredicationLikes> => {
        const [count, isLiked] = await Promise.all([
          predicationService.countLikes(predication.id),
          predicationService.isLikedByCurrentUser(predication.id),
        ])
        if (signal.aborted) throw new Error('Chargement des likes annulé.')
        return { count, isLiked }
      },
      enabled: Boolean(userId),
      staleTime: Infinity,
    })),
  })

  return {
    likesById: Object.fromEntries(predications.map((predication, index) =>
      [predication.id, queries[index].data],
    )),
    error: queries.find((query) => query.isError)?.error,
  }
}
