import { deleteAccountUseCase, profilService } from '@/composition/profil'
import type { ProfilModel } from '@/domain/entities/Profil'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { accessRequestsQueryKey, communityMembersQueryKey, currentProfileQueryKey, rejectedMembersQueryKey } from '@/presentation/queries/profilQueries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useRejectedMembers() {
  const { data: profile, userId, isError } = useCurrentProfile()
  const canManage = !isError && profile?.statutAcces === 'accepte' && ['pasteur', 'admin'].includes(profile.roleApp)
  const queryClient = useQueryClient()
  const canDeleteMember = (member: ProfilModel) => canManage && member.id !== userId &&
    member.statutAcces === 'refuse' && member.roleApp !== 'pasteur' &&
    (profile?.roleApp === 'pasteur' || member.roleApp === 'membre')
  const query = useQuery({
    queryKey: rejectedMembersQueryKey(userId),
    queryFn: () => profilService.listRejectedMembers(),
    enabled: canManage,
    staleTime: Infinity,
  })
  const deletion = useMutation({
    mutationFn: (member: ProfilModel) => {
      if (!canDeleteMember(member)) throw new Error('Vous ne pouvez pas supprimer ce compte.')
      return deleteAccountUseCase.execute(member.id)
    },
    onMutate: () => ({ userId }),
    onSuccess: async (_, member, context) => {
      const queryKey = rejectedMembersQueryKey(context.userId)
      await queryClient.cancelQueries({ queryKey, exact: true })
      queryClient.setQueryData<ProfilModel[]>(queryKey, (members) => members?.filter((item) => item.id !== member.id))
      await queryClient.cancelQueries({ queryKey: currentProfileQueryKey(member.id), exact: true })
      queryClient.removeQueries({ queryKey: currentProfileQueryKey(member.id), exact: true })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey, exact: true }),
        queryClient.invalidateQueries({ queryKey: accessRequestsQueryKey(context.userId), exact: true }),
        queryClient.invalidateQueries({ queryKey: communityMembersQueryKey(context.userId), exact: true }),
      ])
    },
  })
  return { ...query, canManage, canDeleteMember, deletion }
}
