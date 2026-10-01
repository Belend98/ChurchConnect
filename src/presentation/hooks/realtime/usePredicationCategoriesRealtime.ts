import type { CategorieModel } from '@/domain/entités/Categorie'
import { supabase } from '@/infrastructure/supabase/client'
import { CATEGORIES_QUERY_KEY } from '@/presentation/queries/categorieQueries'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

type CategorieRow = {
  categorie_id: string
  name: string
}

function mapCategorieRow(row: CategorieRow): CategorieModel {
  return {
    id: row.categorie_id,
    nom: row.name,
  }
}

function sortCategories(items: CategorieModel[]) {
  return [...items].sort((a, b) => a.nom.localeCompare(b.nom))
}

export function usePredicationCategoriesRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('predication-categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categorie_predication',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const categorie = mapCategorieRow(payload.new as CategorieRow)

            queryClient.setQueryData<CategorieModel[]>(
              CATEGORIES_QUERY_KEY,
              (current = []) =>
                sortCategories([
                  ...current.filter((item) => item.id !== categorie.id),
                  categorie,
                ]),
            )
          }

          if (payload.eventType === 'UPDATE') {
            const categorie = mapCategorieRow(payload.new as CategorieRow)

            queryClient.setQueryData<CategorieModel[]>(
              CATEGORIES_QUERY_KEY,
              (current = []) =>
                sortCategories(
                  current.map((item) =>
                    item.id === categorie.id ? categorie : item,
                  ),
                ),
            )
          }

          if (payload.eventType === 'DELETE') {
            const deletedCategorie = payload.old as Partial<CategorieRow>

            queryClient.setQueryData<CategorieModel[]>(
              CATEGORIES_QUERY_KEY,
              (current = []) =>
                current.filter(
                  (item) => item.id !== deletedCategorie.categorie_id,
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
