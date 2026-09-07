import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const isWeb = Platform.OS === 'web'
const isBrowser = typeof window !== 'undefined'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      ...(isWeb
        ? { persistSession: isBrowser, detectSessionInUrl: true }
        : {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          }),
    },
  },
)
