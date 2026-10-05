import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { useAnnoncesRealtime } from '@/presentation/hooks/realtime/useAnnoncesRealtime'
import { useAccountSessionGuard } from '@/presentation/hooks/auth/useAccountSessionGuard'
import { useCurrentProfileRealtime } from '@/presentation/hooks/realtime/useCurrentProfileRealtime'
import { useCommunityMembersRealtime } from '@/presentation/hooks/realtime/useCommunityMembersRealtime'
import { useNotificationsRealtime } from '@/presentation/hooks/realtime/useNotificationsRealtime'
import { useGroupesRealtime } from '@/presentation/hooks/realtime/useGroupesRealtime'
import { usePredicationCategoriesRealtime } from '@/presentation/hooks/realtime/usePredicationCategoriesRealtime'
import { usePredicationsRealtime } from '@/presentation/hooks/realtime/usePredicationsRealtime'
import { usePredicationFavoritesRealtime } from '@/presentation/hooks/realtime/usePredicationFavoritesRealtime'
import { usePredicationLikesRealtime } from '@/presentation/hooks/realtime/usePredicationLikesRealtime'

export function RealtimeSync() {
  useAccountSessionGuard()
  useCurrentProfileRealtime()
  const { data: profile } = useCurrentProfile()
  return profile?.statutAcces === 'accepte' ? <ApprovedRealtimeSync /> : null
}

function ApprovedRealtimeSync() {
  useCommunityMembersRealtime()
  useNotificationsRealtime()
  useAnnoncesRealtime()
  useGroupesRealtime()
  usePredicationCategoriesRealtime()
  usePredicationsRealtime()
  usePredicationFavoritesRealtime()
  usePredicationLikesRealtime()

  return null
}
