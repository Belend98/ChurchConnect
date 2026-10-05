import { profilService } from '@/composition/profil'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { accessRequestsQueryKey, communityMembersQueryKey, currentProfileQueryKey, rejectedMembersQueryKey } from '@/presentation/queries/profilQueries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useAccessRequests() {
  const { data: profile, userId, isError } = useCurrentProfile()
  const canManage = !isError && profile?.statutAcces === 'accepte' && ['pasteur', 'admin'].includes(profile.roleApp)
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: accessRequestsQueryKey(userId),
    queryFn: () => profilService.listAccessRequests(),
    enabled: canManage,
    staleTime: Infinity,
  })
  const decision = useMutation({
    mutationFn: ({ id, accepted }: { id: string; accepted: boolean }) => profilService.decideAccess(id, accepted),
    onMutate: () => ({ userId }),
    onSuccess: async (_, { id }, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: accessRequestsQueryKey(context.userId), exact: true }),
        queryClient.invalidateQueries({ queryKey: rejectedMembersQueryKey(context.userId), exact: true }),
        queryClient.invalidateQueries({ queryKey: communityMembersQueryKey(context.userId), exact: true }),
        queryClient.invalidateQueries({ queryKey: currentProfileQueryKey(id), exact: true }),
      ])
    },
  })
  return { ...query, canManage, decision }
}
