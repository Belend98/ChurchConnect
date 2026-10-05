import type { ProfilModel } from '@/domain/entités/Profil'
import type { ManagedAppRole } from '@/domain/repositories/RoleAdminGateway'
import type { QueryClient } from '@tanstack/react-query'

export const currentProfileQueryKey = (userId: string | null) =>
  ['current-profile', userId] as const

export const communityMembersQueryKey = (userId: string | null) =>
  ['community-members', userId] as const

export const accessRequestsQueryKey = (userId: string | null) =>
  ['access-requests', userId] as const

export const rejectedMembersQueryKey = (userId: string | null) =>
  ['rejected-members', userId] as const

export async function cacheCommunityMemberRole(
  queryClient: QueryClient,
  userId: string | null,
  memberId: string,
  role: ManagedAppRole,
) {
  const queryKey = communityMembersQueryKey(userId)
  await queryClient.cancelQueries({ queryKey, exact: true })
  queryClient.setQueryData<ProfilModel[]>(queryKey, (members) => members?.map((member) =>
    member.id === memberId ? { ...member, roleApp: role } : member,
  ))
}

export async function cacheCurrentProfile(
  queryClient: QueryClient,
  userId: string,
  profile: ProfilModel | null,
) {
  if (profile && profile.id !== userId) return
  const queryKey = currentProfileQueryKey(userId)
  await queryClient.cancelQueries({ queryKey, exact: true })
  if (queryClient.getQueryState(queryKey)) {
    queryClient.setQueryData<ProfilModel | null>(queryKey, profile)
  }
}
