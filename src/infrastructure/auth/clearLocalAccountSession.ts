import { supabase } from '@/infrastructure/supabase/client'
import { tanstack } from '@/infrastructure/tanstack/client'

export async function clearLocalAccountSession(expectedUserId?: string, expectedAccessToken?: string): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  if (expectedUserId && data.session?.user.id !== expectedUserId) return false
  if (expectedAccessToken && data.session?.access_token !== expectedAccessToken) return false

  const { error } = await supabase.auth.signOut({ scope: 'local' })
  await tanstack.cancelQueries()
  tanstack.clear()
  if (error) throw error
  return true
}
