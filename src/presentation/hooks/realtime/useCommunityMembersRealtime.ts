import { supabase } from '@/infrastructure/supabase/client'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { communityMembersQueryKey } from '@/presentation/queries/profilQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useCommunityMembersRealtime() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  useEffect(() => {
    if (!userId) return
    let active = true
    const queryKey = communityMembersQueryKey(userId)
    const refresh = () => {
      if (active) void queryClient.invalidateQueries({ queryKey, exact: true })
    }
    const channel = supabase
      .channel(`community-members-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_profil',
      }, refresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refresh()
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
      void queryClient.cancelQueries({ queryKey, exact: true })
      queryClient.removeQueries({ queryKey, exact: true })
    }
  }, [queryClient, userId])
}
