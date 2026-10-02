import type { ManagedAppRole, RoleAdminGateway } from '@/domain/repositories/RoleAdminGateway'
import { supabase } from '@/infrastructure/supabase/client'

export class SupabaseRoleAdminGateway implements RoleAdminGateway {
  async changeUserRole(userId: string, role: ManagedAppRole): Promise<void> {
    const { error } = await supabase.rpc('change_user_role', {
      target_user_id: userId,
      new_role: role,
    })
    if (error) throw error
  }
}
