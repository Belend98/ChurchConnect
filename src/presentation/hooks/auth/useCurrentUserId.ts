import { useCurrentSession } from '@/presentation/hooks/auth/useCurrentSession'

export function useCurrentUserId() {
  return useCurrentSession()?.user.id ?? null
}
