import type { CreateProfilModel, ProfilModel } from '@/domain/entités/Profil'
import type { ProfilRepository } from '@/domain/repositories/ProfilRepository'
import { supabase } from '@/infrastructure/supabase/client'

export class SupabaseProfilRepository implements ProfilRepository {
  async createProfile(userId: string, data: CreateProfilModel): Promise<void> {
    const { error } = await supabase.from('user_profil').upsert(
      {
        id: userId,
        username: data.username ?? null,
        nom: data.nom ?? null,
        prenom: data.prenom ?? null,
        bio: data.bio ?? null,
        date_naissance: data.dateNaissance?.toISOString() ?? null,
        is_admin: data.isAdmin ?? false,
      },
      {
        onConflict: 'id',
      },
    )

    if (error) throw error
  }

  async getProfile(userId: string): Promise<ProfilModel | null> {
    const { data, error } = await supabase
      .from('user_profil')
      .select(
        'id, username, nom, prenom, bio, date_naissance, created_at, is_admin',
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
      isAdmin: Boolean(data.is_admin),
      createdAt: new Date(data.created_at as string),
    }
  }

  async updateProfile(userId: string, data: CreateProfilModel): Promise<void> {
    const { error } = await supabase
      .from('user_profil')
      .update({
        username: data.username ?? null,
        nom: data.nom ?? null,
        prenom: data.prenom ?? null,
        bio: data.bio ?? null,
        date_naissance: data.dateNaissance?.toISOString() ?? null,
        ...(data.isAdmin !== undefined ? { is_admin: data.isAdmin } : {}),
      })
      .eq('id', userId)

    if (error) throw error
  }

  async deleteAccountData(): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError
    if (!user) return

    const { error } = await supabase
      .from('user_profil')
      .delete()
      .eq('id', user.id)

    if (error) throw error
  }
}
