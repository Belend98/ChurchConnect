import type { ProfilModel } from '@/domain/entités/Profil'
import type { QueryClient } from '@tanstack/react-query'

export const currentProfileQueryKey = (userId: string | null) =>
  ['current-profile', userId] as const

export async function cacheCurrentProfile(
  queryClient: QueryClient,
  userId: string,
  profile: ProfilModel | null,
) {
  if (profile && profile.id !== userId) return
  const queryKey = currentProfileQueryKey(userId)
  await queryClient.cancelQueries({ queryKey, exact: true })
  // Do not recreate a cache cleared by sign-out while the mutation was pending.
  if (queryClient.getQueryState(queryKey)) {
    queryClient.setQueryData<ProfilModel | null>(queryKey, profile)
  }
}
