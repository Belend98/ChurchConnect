import type { CreateUserModel } from '@/domain/entités/User'
import type {
  UserProfile,
  UserRepository,
} from '@/domain/repositories/UserRepository'
import { supabase } from '@/infrastructure/supabase/client'

export class SupabaseUserRepository implements UserRepository {
  async createProfile(userId: string, data: CreateUserModel): Promise<void> {
    const { error } = await supabase.from('users').upsert(
      {
        id: userId,
        username: data.username,
        bio: data.bio ?? null,
      },
      {
        onConflict: 'id',
      },
    )

    if (error) throw error
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, bio, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      id: data.id as string,
      username: (data.username as string) ?? '',
      bio: (data.bio as string | null) ?? null,
      createdAt: data.created_at ? new Date(data.created_at as string) : null,
    }
  }

  async updateProfile(userId: string, data: CreateUserModel): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        username: data.username,
        bio: data.bio ?? null,
      })
      .eq('id', userId)

    if (error) throw error
  }

  async deleteAccountData(): Promise<void> {
    const { error } = await supabase.rpc('delete_current_user_account_data')

    if (error) throw error
  }
}
