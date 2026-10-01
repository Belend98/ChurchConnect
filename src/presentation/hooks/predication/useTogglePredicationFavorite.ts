import { predicationService } from '@/composition/predication'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { cachePredicationFavorite, predicationFavoritesKey } from '@/presentation/queries/predicationQueries'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useTogglePredicationFavorite() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  return useMutation({
    mutationFn: (predicationId: string) => predicationService.toggleFavorite(predicationId),
    onMutate: async (predicationId) => {
      if (!userId) throw new Error('Utilisateur non connecté.')
      const queryKey = predicationFavoritesKey(userId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<string[]>(queryKey)
      cachePredicationFavorite(queryClient, queryKey, predicationId, !previous?.includes(predicationId))
      return { queryKey, previous }
    },
    onSuccess: (isFavorite, predicationId, context) => {
      if (context) cachePredicationFavorite(queryClient, context.queryKey, predicationId, isFavorite)
    },
    onError: (_error, _predicationId, context) => {
      if (context?.previous) queryClient.setQueryData(context.queryKey, context.previous)
    },
    onSettled: (_data, _error, _predicationId, context) => {
      if (context && !context.previous) {
        void queryClient.invalidateQueries({ queryKey: context.queryKey })
      }
    },
  })
}
