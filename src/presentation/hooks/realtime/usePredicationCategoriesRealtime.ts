import { supabase } from '@/infrastructure/supabase/client'
import { CATEGORIES_QUERY_KEY } from '@/presentation/queries/categorieQueries'
import { PREDICATIONS_QUERY_KEY } from '@/presentation/queries/predicationQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export function usePredicationCategoriesRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    const refresh = () => {
      if (active) void queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY })
    }
    const channel = supabase
      .channel('predication-categories-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'categorie_predication',
      }, (payload) => {
        refresh()
        if (active && payload.eventType === 'DELETE') {
          void queryClient.invalidateQueries({ queryKey: PREDICATIONS_QUERY_KEY })
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          refresh()
          if (active) void queryClient.invalidateQueries({ queryKey: PREDICATIONS_QUERY_KEY })
        }
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [queryClient])
}
