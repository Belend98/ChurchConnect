import { supabase } from '@/infrastructure/supabase/client'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { cachePredicationFavorite, predicationFavoritesKey } from '@/presentation/queries/predicationQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function usePredicationFavoritesRealtime() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  useEffect(() => {
    if (!userId) return

    let active = true
    const queryKey = predicationFavoritesKey(userId)
    const channel = supabase
      .channel(`predication-favorites-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'predication_favorites', filter: `user_id=eq.${userId}`,
      }, async (payload) => {
        if (!active || payload.new.user_id !== userId) return
        const predicationId = payload.new.predication_id
        if (typeof predicationId !== 'string' || !predicationId) return
        await queryClient.cancelQueries({ queryKey })
        if (!active) return
        cachePredicationFavorite(queryClient, queryKey, predicationId, true)
        if (!queryClient.getQueryData(queryKey)) void queryClient.invalidateQueries({ queryKey })
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'predication_favorites',
      }, (payload) => {
        if (!active) return
        if (payload.old.user_id && payload.old.user_id !== userId) return
        void queryClient.invalidateQueries({ queryKey })
      })
      .subscribe((status) => {
        if (active && status === 'SUBSCRIBED') {
          void queryClient.invalidateQueries({ queryKey })
        }
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
      void queryClient.cancelQueries({ queryKey })
      queryClient.removeQueries({ queryKey })
    }
  }, [queryClient, userId])
}
