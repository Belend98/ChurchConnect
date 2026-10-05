import type { QueryClient } from '@tanstack/react-query'

export const PREDICATIONS_QUERY_KEY = ['predications'] as const

export type PredicationLikes = { count: number; isLiked: boolean }

export const predicationLikesKey = (userId: string | null) =>
  ['predication-likes', userId] as const

export const predicationLikeKey = (userId: string | null, predicationId: string) =>
  [...predicationLikesKey(userId), predicationId] as const

export const predicationFavoritesKey = (userId: string | null) =>
  ['predication-favorites', userId] as const

export function cachePredicationFavorite(
  queryClient: QueryClient,
  queryKey: ReturnType<typeof predicationFavoritesKey>,
  predicationId: string,
  isFavorite: boolean,
) {
  queryClient.setQueryData<string[]>(queryKey, (current) => {
    if (!current) return undefined
    const withoutFavorite = current.filter((id) => id !== predicationId)
    return isFavorite ? [...withoutFavorite, predicationId] : withoutFavorite
  })
}
