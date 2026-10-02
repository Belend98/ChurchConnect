import { clearLocalAccountSession } from '@/infrastructure/auth/clearLocalAccountSession'
import { supabase } from '@/infrastructure/supabase/client'
import { tanstack } from '@/infrastructure/tanstack/client'
import { useCurrentSession } from '@/presentation/hooks/auth/useCurrentSession'
import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'

export function useAccountSessionGuard() {
  const session = useCurrentSession()
  const hadSession = useRef(false)

  useEffect(() => {
    if (session === undefined) return
    if (!session && hadSession.current) {
      void tanstack.cancelQueries()
      tanstack.clear()
      router.replace('/(auth)/signin')
    }
    hadSession.current = Boolean(session)
  }, [session])

  useEffect(() => {
    if (!session) return
    let active = true
    let running = false
    const verifySession = async () => {
      if (!active || running) return
      running = true
      try {
        const { data: isActive, error, status } = await supabase.rpc('is_active_account_session')
        if (!active || (error ? status !== 401 : isActive !== false)) return
        const cleared = await clearLocalAccountSession(session.user.id, session.access_token)
        if (cleared) router.replace('/(auth)/signin')
      } catch (error) {
        console.warn('Impossible de vérifier la session du compte.', error)
      } finally {
        running = false
      }
    }
    const refresh = () => { void verifySession() }
    refresh()
    const interval = setInterval(refresh, 30_000)
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh()
    })
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', refresh)
      window.addEventListener('online', refresh)
    }

    return () => {
      active = false
      clearInterval(interval)
      appState.remove()
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('focus', refresh)
        window.removeEventListener('online', refresh)
      }
    }
  }, [session])
}
