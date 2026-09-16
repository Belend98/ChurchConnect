import { supabase } from '@/infrastructure/supabase/client'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'

function getAuthParams(url: string) {
  const params = new URLSearchParams()
  const [, query = ''] = url.split('?')
  const [queryString = '', hashString = ''] = query.split('#')
  const hash = url.includes('#') && !query.includes('#') ? url.split('#')[1] : hashString

  for (const part of [queryString, hash]) {
    if (!part) continue

    const values = new URLSearchParams(part)
    values.forEach((value, key) => {
      params.set(key, value)
    })
  }

  return params
}

async function exchangeCodeFromUrl(url: string) {
  const params = getAuthParams(url)
  const errorCode = params.get('error_code') ?? params.get('error')

  if (errorCode) {
    console.warn('Erreur de confirmation Supabase depuis le lien email.', errorCode)
    return
  }

  const code = params.get('code')
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(url)

    if (error) {
      console.warn('Impossible de confirmer la session Supabase depuis le lien email.', error)
      return
    }

    router.replace('/')
    return
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      console.warn('Impossible de créer la session Supabase depuis le lien email.', error)
      return
    }

    router.replace('/')
  }
}

export function useSupabaseAuthRedirect() {
  useEffect(() => {
    if (Platform.OS === 'web') return undefined

    Linking.getInitialURL()
      .then((url) => {
        if (url) void exchangeCodeFromUrl(url)
      })
      .catch((error) => {
        console.warn('Impossible de lire le lien initial.', error)
      })

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void exchangeCodeFromUrl(url)
    })

    return () => {
      subscription.remove()
    }
  }, [])
}
