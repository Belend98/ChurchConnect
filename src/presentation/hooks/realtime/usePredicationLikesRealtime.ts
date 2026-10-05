import { supabase } from '@/infrastructure/supabase/client'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { predicationLikesKey } from '@/presentation/queries/predicationQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function usePredicationLikesRealtime() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  useEffect(() => {
    if (!userId) return
    let active = true
    const queryKey = predicationLikesKey(userId)
    const refresh = () => {
      if (active) void queryClient.invalidateQueries({ queryKey })
    }
    const channel = supabase
      .channel(`predication-likes-${userId}`)
      // Les compteurs incluent les likes de tous les comptes. Les DELETE peuvent
      // ne contenir que la clé primaire : on recharge sans dépendre du payload.
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'predication_likes',
      }, refresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') refresh()
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
      void queryClient.cancelQueries({ queryKey })
      queryClient.removeQueries({ queryKey })
    }
  }, [queryClient, userId])
}
