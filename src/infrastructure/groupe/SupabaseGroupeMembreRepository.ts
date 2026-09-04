import type {
  CreateGroupeMembreModel,
  GroupeMembreModel,
  UpdateGroupeMembreModel,
} from '@/domain/entités/GroupeMember'
import type { GroupeMembreRepository } from '@/domain/repositories/GroupeMembreRepository'
import { supabase } from '@/infrastructure/supabase/client'

type GroupeMembreRow = {
  gmembre_id: string
  groupe_id: string
  user_id: string
  is_group_admin: boolean
  joined_at: string
}

const GROUPE_MEMBRE_SELECT =
  'gmembre_id, groupe_id, user_id, is_group_admin, joined_at'

function mapGroupeMembre(row: GroupeMembreRow): GroupeMembreModel {
  return {
    id: row.gmembre_id,
    groupeId: row.groupe_id,
    userId: row.user_id,
    isGroupAdmin: row.is_group_admin,
    joinedAt: new Date(row.joined_at),
  }
}

export class SupabaseGroupeMembreRepository
  implements GroupeMembreRepository
{
  async create(data: CreateGroupeMembreModel): Promise<GroupeMembreModel> {
    const { data: membre, error } = await supabase
      .from('groupe_membre')
      .insert({
        groupe_id: data.groupeId,
        user_id: data.userId,
        is_group_admin: data.isGroupAdmin,
      })
      .select(GROUPE_MEMBRE_SELECT)
      .single()

    if (error) throw error

    return mapGroupeMembre(membre as GroupeMembreRow)
  }

  async getById(id: string): Promise<GroupeMembreModel | null> {
    const { data, error } = await supabase
      .from('groupe_membre')
      .select(GROUPE_MEMBRE_SELECT)
      .eq('gmembre_id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return mapGroupeMembre(data as GroupeMembreRow)
  }

  async listByGroupe(groupeId: string): Promise<GroupeMembreModel[]> {
    const { data, error } = await supabase
      .from('groupe_membre')
      .select(GROUPE_MEMBRE_SELECT)
      .eq('groupe_id', groupeId)
      .order('joined_at', { ascending: true })

    if (error) throw error

    return ((data ?? []) as GroupeMembreRow[]).map(mapGroupeMembre)
  }

  async listByUser(userId: string): Promise<GroupeMembreModel[]> {
    const { data, error } = await supabase
      .from('groupe_membre')
      .select(GROUPE_MEMBRE_SELECT)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as GroupeMembreRow[]).map(mapGroupeMembre)
  }

  async update(
    id: string,
    data: UpdateGroupeMembreModel,
  ): Promise<GroupeMembreModel> {
    const { data: membre, error } = await supabase
      .from('groupe_membre')
      .update({
        ...(data.isGroupAdmin !== undefined
          ? { is_group_admin: data.isGroupAdmin }
          : {}),
      })
      .eq('gmembre_id', id)
      .select(GROUPE_MEMBRE_SELECT)
      .single()

    if (error) throw error

    return mapGroupeMembre(membre as GroupeMembreRow)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('groupe_membre')
      .delete()
      .eq('gmembre_id', id)

    if (error) throw error
  }

  async deleteByGroupeAndUser(
    groupeId: string,
    userId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from('groupe_membre')
      .delete()
      .eq('groupe_id', groupeId)
      .eq('user_id', userId)

    if (error) throw error
  }
}
