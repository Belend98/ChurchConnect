import type { PredicationModel } from '@/domain/entités/Predication'
import { supabase } from '@/infrastructure/supabase/client'
import { PREDICATIONS_QUERY_KEY } from '@/presentation/queries/predicationQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

type PredicationRow = {
  predication_id: string
  categorie_id: string | null
  title: string
  media_url: string
  duration_seconds: number | null
  created_at: string
}

function mapPredicationRow(row: PredicationRow): PredicationModel {
  return {
    id: row.predication_id,
    categorieId: row.categorie_id ?? undefined,
    title: row.title,
    mediaUrl: row.media_url,
    durationSeconds: row.duration_seconds ?? undefined,
    createdAt: new Date(row.created_at),
  }
}

export function usePredicationsRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('predication-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'predication',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const predication = mapPredicationRow(payload.new as PredicationRow)

            queryClient.setQueryData<PredicationModel[]>(
              PREDICATIONS_QUERY_KEY,
              (current = []) => [
                predication,
                ...current.filter((item) => item.id !== predication.id),
              ],
            )
          }

          if (payload.eventType === 'UPDATE') {
            const predication = mapPredicationRow(payload.new as PredicationRow)

            queryClient.setQueryData<PredicationModel[]>(
              PREDICATIONS_QUERY_KEY,
              (current = []) =>
                current.map((item) =>
                  item.id === predication.id ? predication : item,
                ),
            )
          }

          if (payload.eventType === 'DELETE') {
            const deletedPredication = payload.old

            queryClient.setQueryData<PredicationModel[]>(
              PREDICATIONS_QUERY_KEY,
              (current = []) =>
                current.filter(
                  (item) => item.id !== deletedPredication.predication_id,
                ),
            )
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [queryClient])
}
