import { mapProfil, type ProfilRow } from '@/infrastructure/profil/SupabaseProfilRepository'
import { supabase } from '@/infrastructure/supabase/client'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { cacheCurrentProfile, currentProfileQueryKey } from '@/presentation/queries/profilQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function useCurrentProfileRealtime() {
  const queryClient = useQueryClient()
  const userId = useCurrentUserId()

  useEffect(() => {
    if (!userId) return
    let active = true
    const queryKey = currentProfileQueryKey(userId)
    const syncRow = (row: ProfilRow) => {
      if (active) void cacheCurrentProfile(queryClient, userId, mapProfil(row))
    }
    const channel = supabase.channel(`current-profile-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'user_profil', filter: `id=eq.${userId}`,
      }, (payload) => syncRow(payload.new as ProfilRow))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'user_profil', filter: `id=eq.${userId}`,
      }, (payload) => syncRow(payload.new as ProfilRow))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'user_profil',
      }, (payload) => {
        if (active && payload.old.id === userId) {
          void cacheCurrentProfile(queryClient, userId, null)
        }
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
