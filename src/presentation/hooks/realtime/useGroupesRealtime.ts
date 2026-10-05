import { mapGroupe, type GroupeRow } from '@/infrastructure/groupe/SupabaseGroupeRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { cacheGroupe, groupeKeys, removeCachedGroupe } from '@/presentation/queries/groupeQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useGroupesRealtime() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  useEffect(() => {
    if (!userId) return

    let active = true
    const queryKey = groupeKeys.user(userId)
    const channel = supabase
      .channel(`groupes-changes-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'groupe',
      }, async (payload) => {
        if (!active || payload.eventType === 'INSERT') return
        const id = payload.eventType === 'DELETE'
          ? payload.old.groupe_id as string | undefined
          : payload.new.groupe_id as string
        if (!id) return

        await Promise.all([
          queryClient.cancelQueries({ queryKey: groupeKeys.list(userId) }),
          queryClient.cancelQueries({ queryKey: groupeKeys.detail(userId, id) }),
        ])
        if (!active) return
        if (payload.eventType === 'DELETE') {
          removeCachedGroupe(queryClient, userId, id)
        } else {
          cacheGroupe(queryClient, userId, mapGroupe(payload.new as GroupeRow))
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'groupe_membre',
      }, (payload) => {
        if (!active) return
        if (payload.eventType === 'DELETE') {
          void queryClient.invalidateQueries({ queryKey })
          return
        }

        const id = payload.new.groupe_id as string
        void queryClient.invalidateQueries({ queryKey: groupeKeys.members(userId, id) })
        if (payload.new.user_id === userId) {
          void queryClient.invalidateQueries({ queryKey: groupeKeys.list(userId) })
          void queryClient.invalidateQueries({ queryKey: groupeKeys.detail(userId, id) })
        }
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
