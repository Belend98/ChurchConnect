import type { CreateProfilModel, ProfilModel } from '@/domain/entités/User'
import type { UserRepository } from '@/domain/repositories/UserRepository'
import { supabase } from '@/infrastructure/supabase/client'

export class SupabaseUserRepository implements UserRepository {
  async createProfile(userId: string, data: CreateProfilModel): Promise<void> {
    const { error } = await supabase.from('users').upsert(
      {
        id: userId,
        username: data.username ?? null,
        nom: data.nom ?? null,
        prenom: data.prenom ?? null,
        bio: data.bio ?? null,
        date_naissance: data.dateNaissance?.toISOString() ?? null,
      },
      {
        onConflict: 'id',
      },
    )

    if (error) throw error
  }

  async getProfile(userId: string): Promise<ProfilModel | null> {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, username, nom, prenom, bio, date_naissance, created_at',
      )
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      id: data.id as string,
      username: (data.username as string | null) ?? undefined,
      nom: (data.nom as string | null) ?? undefined,
      prenom: (data.prenom as string | null) ?? undefined,
      bio: (data.bio as string | null) ?? undefined,
      dateNaissance: data.date_naissance
        ? new Date(data.date_naissance as string)
        : undefined,
      createdAt: new Date(data.created_at as string),
    }
  }

  async updateProfile(userId: string, data: CreateProfilModel): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        username: data.username ?? null,
        nom: data.nom ?? null,
        prenom: data.prenom ?? null,
        bio: data.bio ?? null,
        date_naissance: data.dateNaissance?.toISOString() ?? null,
      })
      .eq('id', userId)

    if (error) throw error
  }

  async deleteAccountData(): Promise<void> {
    const { error } = await supabase.rpc('delete_current_user_account_data')

    if (error) throw error
  }
}
