import { useAnnoncesRealtime } from '@/presentation/hooks/realtime/useAnnoncesRealtime'
import { useCurrentProfileRealtime } from '@/presentation/hooks/realtime/useCurrentProfileRealtime'
import { useNotificationsRealtime } from '@/presentation/hooks/realtime/useNotificationsRealtime'
import { useGroupesRealtime } from '@/presentation/hooks/realtime/useGroupesRealtime'
import { usePredicationCategoriesRealtime } from '@/presentation/hooks/realtime/usePredicationCategoriesRealtime'
import { usePredicationsRealtime } from '@/presentation/hooks/realtime/usePredicationsRealtime'
import { usePredicationFavoritesRealtime } from '@/presentation/hooks/realtime/usePredicationFavoritesRealtime'

export function RealtimeSync() {
  useCurrentProfileRealtime()
  useNotificationsRealtime()
  useAnnoncesRealtime()
  useGroupesRealtime()
  usePredicationCategoriesRealtime()
  usePredicationsRealtime()
  usePredicationFavoritesRealtime()

  return null
}
