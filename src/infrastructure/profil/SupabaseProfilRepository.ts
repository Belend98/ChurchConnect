import {
  APP_ROLES,
  DEFAULT_APP_ROLE,
  type AppRole,
  type CreateProfilModel,
  type ProfilModel,
} from '@/domain/entities/Profil'
import type { ProfilRepository } from '@/domain/repositories/ProfilRepository'
import { supabase } from '@/infrastructure/supabase/client'

export type ProfilRow = {
  id: string
  username: string | null
  nom: string | null
  prenom: string | null
  bio: string | null
  image_url: string | null
  date_naissance: string | null
  created_at: string
  role_app: string | null
  statut_acces: 'en_attente' | 'accepte' | 'refuse'
}

const PROFIL_SELECT =
  'id, username, nom, prenom, bio, image_url, date_naissance, created_at, role_app, statut_acces'

function toAppRole(role: string | null): AppRole {
  return APP_ROLES.find((appRole) => appRole === role) ?? DEFAULT_APP_ROLE
}

export function mapProfil(data: ProfilRow): ProfilModel {
  const roleApp = toAppRole(data.role_app)

  return {
    id: data.id,
    username: data.username ?? undefined,
    nom: data.nom ?? undefined,
    prenom: data.prenom ?? undefined,
    bio: data.bio ?? undefined,
    imageUrl: data.image_url ?? undefined,
    dateNaissance: data.date_naissance
      ? new Date(data.date_naissance)
      : undefined,
    roleApp,
    statutAcces: data.statut_acces === 'accepte' || data.statut_acces === 'refuse' ? data.statut_acces : 'en_attente',
    createdAt: new Date(data.created_at),
  }
}

export class SupabaseProfilRepository implements ProfilRepository {
  async createProfile(userId: string, data: CreateProfilModel): Promise<ProfilModel> {
    const { data: profile, error } = await supabase.from('user_profil').upsert(
      {
        id: userId,
        username: data.username ?? null,
        nom: data.nom ?? null,
        prenom: data.prenom ?? null,
        bio: data.bio ?? null,
        image_url: data.imageUrl ?? null,
        date_naissance: data.dateNaissance?.toISOString() ?? null,
        ...(data.roleApp !== undefined ? { role_app: data.roleApp } : {}),
      },
      {
        onConflict: 'id',
      },
    ).select(PROFIL_SELECT).single()

    if (error) throw error
    return mapProfil(profile)
  }

  async findByUsername(username: string): Promise<ProfilModel | null> {
    const { data, error } = await supabase
      .from('user_profil')
      .select(PROFIL_SELECT)
      .ilike('username', username)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return mapProfil(data)
  }

  async getProfile(userId: string): Promise<ProfilModel | null> {
    const { data, error } = await supabase
      .from('user_profil')
      .select(PROFIL_SELECT)
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return mapProfil(data)
  }

  async listCommunityMembers(limit?: number): Promise<ProfilModel[]> {
    let query = supabase
      .from('user_profil')
      .select(PROFIL_SELECT)
      .eq('statut_acces', 'accepte')
      .order('created_at', { ascending: false })

    if (limit !== undefined) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error

    return (data ?? []).map(mapProfil)
  }

  async ensurePendingProfile(userId: string, nom: string, prenom?: string): Promise<ProfilModel> {
    const { error } = await supabase.from('user_profil').upsert(
      { id: userId, nom, prenom: prenom ?? null },
      { onConflict: 'id', ignoreDuplicates: true },
    )
    if (error) throw error
    const profile = await this.getProfile(userId)
    if (!profile) throw new Error('Impossible de créer la demande d’accès.')
    return profile
  }

  async listAccessRequests(): Promise<ProfilModel[]> {
    const { data, error } = await supabase.from('user_profil')
      .select(PROFIL_SELECT)
      .eq('statut_acces', 'en_attente')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapProfil)
  }

  async listRejectedMembers(): Promise<ProfilModel[]> {
    const { data, error } = await supabase.from('user_profil')
      .select(PROFIL_SELECT)
      .eq('statut_acces', 'refuse')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(mapProfil)
  }

  async decideAccess(userId: string, accepted: boolean): Promise<void> {
    const { error } = await supabase.rpc('decide_account_access', {
      target_user_id: userId,
      accepted,
    })
    if (error) throw error
  }

  async listByIds(ids: string[]): Promise<ProfilModel[]> {
    if (ids.length === 0) return []

    const { data, error } = await supabase
      .from('user_profil')
      .select(PROFIL_SELECT)
      .in('id', ids)
      .order('username', { ascending: true })

    if (error) throw error

    return (data ?? []).map(mapProfil)
  }

  async updateProfile(userId: string, data: CreateProfilModel): Promise<ProfilModel> {
    const { data: profile, error } = await supabase
      .from('user_profil')
      .update({
        username: data.username ?? null,
        nom: data.nom ?? null,
        prenom: data.prenom ?? null,
        bio: data.bio ?? null,
        image_url: data.imageUrl ?? null,
        date_naissance: data.dateNaissance?.toISOString() ?? null,
        ...(data.roleApp !== undefined ? { role_app: data.roleApp } : {}),
      })
      .eq('id', userId)
      .select(PROFIL_SELECT)
      .single()

    if (error) throw error
    return mapProfil(profile)
  }

}
