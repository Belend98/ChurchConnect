import { mapAnnonce, type AnnonceRow } from '@/infrastructure/annonce/SupabaseAnnonceRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { annoncesQueryKey, applyAnnonceChange } from '@/presentation/queries/annonceQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useAnnoncesRealtime() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  useEffect(() => {
    if (!userId) return

    let active = true
    const queryKey = annoncesQueryKey(userId)
    const channel = supabase
      .channel(`annonces-changes-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'annonce',
      }, (payload) => {
        if (!active) return

        if (payload.eventType === 'DELETE') {
          const id = payload.old.annonce_id
          if (typeof id === 'string' && id) void applyAnnonceChange(queryClient, userId, { type: 'delete', id })
          return
        }

        void applyAnnonceChange(queryClient, userId, {
          type: 'upsert',
          annonce: mapAnnonce(payload.new as AnnonceRow),
        })
      })
      .subscribe((status) => {
        if (active && status === 'SUBSCRIBED') {
          void queryClient.invalidateQueries({ queryKey, exact: true })
        }
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
      void queryClient.cancelQueries({ queryKey, exact: true })
      queryClient.removeQueries({ queryKey, exact: true })
    }
  }, [queryClient, userId])
}
