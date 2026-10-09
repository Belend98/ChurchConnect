import type { AnnonceModel } from '@/domain/entities/Annonce'
import type { QueryClient } from '@tanstack/react-query'

export const ANNONCES_QUERY_KEY = ['annonces'] as const

export const annoncesQueryKey = (userId: string | null) =>
  [...ANNONCES_QUERY_KEY, userId] as const

type AnnonceChange =
  | { type: 'upsert'; annonce: AnnonceModel }
  | { type: 'delete'; id: string }

export async function applyAnnonceChange(
  queryClient: QueryClient,
  userId: string,
  change: AnnonceChange,
) {
  const queryKey = annoncesQueryKey(userId)
  await queryClient.cancelQueries({ queryKey, exact: true })
  queryClient.setQueryData<AnnonceModel[]>(queryKey, (current) => {
    if (!current) return undefined
    if (change.type === 'delete') {
      return current.filter((item) => item.id !== change.id)
    }

    return [
      ...current.filter((item) => item.id !== change.annonce.id),
      change.annonce,
    ].sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
  })

  if (!queryClient.getQueryData(queryKey)) {
    await queryClient.invalidateQueries({ queryKey, exact: true })
  }
}
