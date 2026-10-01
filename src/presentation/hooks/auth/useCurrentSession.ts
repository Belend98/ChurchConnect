import { supabase } from '@/infrastructure/supabase/client'
import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export function useCurrentSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return session
}
