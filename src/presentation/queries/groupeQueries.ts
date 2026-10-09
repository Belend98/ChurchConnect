import type { GroupeModel } from '@/domain/entities/Groupe'
import type { QueryClient } from '@tanstack/react-query'

export const GROUPES_QUERY_KEY = ['groupes'] as const

export const groupeKeys = {
  user: (userId: string | null) => [...GROUPES_QUERY_KEY, userId] as const,
  list: (userId: string | null) => [...GROUPES_QUERY_KEY, userId, 'list'] as const,
  detail: (userId: string | null, id: string) =>
    [...GROUPES_QUERY_KEY, userId, 'detail', id] as const,
  members: (userId: string | null, id: string) =>
    [...GROUPES_QUERY_KEY, userId, 'members', id] as const,
}

export function cacheGroupe(
  queryClient: QueryClient,
  userId: string,
  groupe: GroupeModel,
  insert = false,
) {
  queryClient.setQueryData<GroupeModel[]>(groupeKeys.list(userId), (current) => {
    if (!current) return undefined
    if (!insert && !current.some((item) => item.id === groupe.id)) return current

    return [...current.filter((item) => item.id !== groupe.id), groupe].sort(
      (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
    )
  })
  queryClient.setQueryData<GroupeModel | null>(
    groupeKeys.detail(userId, groupe.id),
    (current) => (current ? groupe : undefined),
  )
  if (!queryClient.getQueryData(groupeKeys.list(userId))) {
    void queryClient.invalidateQueries({ queryKey: groupeKeys.list(userId) })
  }
  if (queryClient.getQueryData(groupeKeys.detail(userId, groupe.id)) === undefined) {
    void queryClient.invalidateQueries({ queryKey: groupeKeys.detail(userId, groupe.id) })
  }
}

export function removeCachedGroupe(
  queryClient: QueryClient,
  userId: string,
  id: string,
) {
  queryClient.setQueryData<GroupeModel[]>(groupeKeys.list(userId), (current) =>
    current?.filter((item) => item.id !== id),
  )
  if (queryClient.getQueryState(groupeKeys.detail(userId, id))) {
    queryClient.setQueryData<GroupeModel | null>(groupeKeys.detail(userId, id), null)
  }
  queryClient.removeQueries({ queryKey: groupeKeys.members(userId, id), exact: true })
  if (!queryClient.getQueryData(groupeKeys.list(userId))) {
    void queryClient.invalidateQueries({ queryKey: groupeKeys.list(userId) })
  }
}
