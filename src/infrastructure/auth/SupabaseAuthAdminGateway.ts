import type { AuthAdminGateway } from '@/domain/repositories/AuthAdminGateway'
import { supabase } from '@/infrastructure/supabase/client'

export class SupabaseAuthAdminGateway implements AuthAdminGateway {
  async deleteUser(userId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
      body: { userId },
    })
    if (error) {
      if (error.context instanceof Response) {
        const response = await error.context.clone().json().catch(() => null)
        if (typeof response?.error === 'string') throw new Error(response.error)
      }
      throw error
    }
    if (data?.success !== true) {
      throw new Error('La suppression du compte n’a pas été confirmée par le serveur.')
    }
  }
}
