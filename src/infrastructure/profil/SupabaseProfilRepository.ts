import {
  APP_ROLES,
  DEFAULT_APP_ROLE,
  type AppRole,
  type CreateProfilModel,
  type ProfilModel,
} from '@/domain/entités/Profil'
import type { ProfilRepository } from '@/domain/repositories/ProfilRepository'
import { supabase } from '@/infrastructure/supabase/client'

type ProfilRow = {
  id: string
  username: string | null
  nom: string | null
  prenom: string | null
  bio: string | null
  date_naissance: string | null
  created_at: string
  role_app: string | null
  is_admin: boolean | null
}

const PROFIL_SELECT =
  'id, username, nom, prenom, bio, date_naissance, created_at, role_app, is_admin'

function toAppRole(role: string | null): AppRole {
  if (APP_ROLES.includes(role as AppRole)) return role as AppRole

  return DEFAULT_APP_ROLE
}

function mapProfil(data: ProfilRow): ProfilModel {
  const roleApp = toAppRole(data.role_app)

  return {
    id: data.id,
    username: data.username ?? undefined,
    nom: data.nom ?? undefined,
    prenom: data.prenom ?? undefined,
    bio: data.bio ?? undefined,
    dateNaissance: data.date_naissance
      ? new Date(data.date_naissance)
      : undefined,
    roleApp,
    isAdmin: roleApp === 'admin' || roleApp === 'pasteur' || Boolean(data.is_admin),
    createdAt: new Date(data.created_at),
  }
}

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
        role_app: data.roleApp ?? (data.isAdmin ? 'admin' : DEFAULT_APP_ROLE),
        is_admin: data.isAdmin ?? false,
      },
      {
        onConflict: 'id',
      },
    )

    if (error) throw error
  }

  async findByUsername(username: string): Promise<ProfilModel | null> {
    const { data, error } = await supabase
      .from('user_profil')
      .select(PROFIL_SELECT)
      .ilike('username', username)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return mapProfil(data as ProfilRow)
  }

  async getProfile(userId: string): Promise<ProfilModel | null> {
    const { data, error } = await supabase
      .from('user_profil')
      .select(PROFIL_SELECT)
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return mapProfil(data as ProfilRow)
  }

  async listByIds(ids: string[]): Promise<ProfilModel[]> {
    if (ids.length === 0) return []

    const { data, error } = await supabase
      .from('user_profil')
      .select(PROFIL_SELECT)
      .in('id', ids)
      .order('username', { ascending: true })

    if (error) throw error

    return ((data ?? []) as ProfilRow[]).map(mapProfil)
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
        ...(data.roleApp !== undefined ? { role_app: data.roleApp } : {}),
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
