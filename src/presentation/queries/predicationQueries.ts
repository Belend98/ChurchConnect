import type { QueryClient } from '@tanstack/react-query'

export const PREDICATIONS_QUERY_KEY = ['predications'] as const

export const predicationFavoritesKey = (userId: string | null) =>
  ['predication-favorites', userId] as const

export function cachePredicationFavorite(
  queryClient: QueryClient,
  queryKey: ReturnType<typeof predicationFavoritesKey>,
  predicationId: string,
  isFavorite: boolean,
) {
  queryClient.setQueryData<string[]>(queryKey, (current) => {
    // Do not turn an unloaded list into a partial, fresh cache.
    if (!current) return undefined
    const withoutFavorite = current.filter((id) => id !== predicationId)
    return isFavorite ? [...withoutFavorite, predicationId] : withoutFavorite
  })
}
