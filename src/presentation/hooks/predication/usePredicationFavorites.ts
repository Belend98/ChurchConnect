import { predicationService } from '@/composition/predication'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { predicationFavoritesKey } from '@/presentation/queries/predicationQueries'
import { useQuery } from '@tanstack/react-query'

export function usePredicationFavorites() {
  const userId = useCurrentUserId()

  return useQuery({
    queryKey: predicationFavoritesKey(userId),
    queryFn: async () => {
      if (!userId) throw new Error('Utilisateur non connecté.')
      const favorites = await predicationService.listFavoritesByUser(userId)
      return favorites.map((favorite) => favorite.predicationId)
    },
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
