import { predicationService } from '@/composition/predication'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { predicationLikeKey, type PredicationLikes } from '@/presentation/queries/predicationQueries'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useTogglePredicationLike() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  return useMutation({
    mutationFn: (predicationId: string) => predicationService.toggleLike(predicationId),
    onMutate: async (predicationId) => {
      if (!userId) throw new Error('Utilisateur non connecté.')
      const queryKey = predicationLikeKey(userId, predicationId)
      await queryClient.cancelQueries({ queryKey, exact: true })
      const previous = queryClient.getQueryData<PredicationLikes>(queryKey)
      if (previous) {
        queryClient.setQueryData<PredicationLikes>(queryKey, {
          isLiked: !previous.isLiked,
          count: Math.max(0, previous.count + (previous.isLiked ? -1 : 1)),
        })
      }
      return { queryKey, previous, userId }
    },
    onError: (_error, _predicationId, context) => {
      if (context?.previous && context.userId === userId) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
    },
    onSettled: (_result, _error, _predicationId, context) => {
      if (context && context.userId === userId) {
        return queryClient.invalidateQueries({ queryKey: context.queryKey, exact: true })
      }
    },
  })
}
