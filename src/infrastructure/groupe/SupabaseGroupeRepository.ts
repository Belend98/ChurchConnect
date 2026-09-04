import type {
  CreateGroupeModel,
  GroupeModel,
  UpdateGroupeModel,
} from '@/domain/entités/Groupe'
import type { GroupeRepository } from '@/domain/repositories/GroupeRepository'
import { supabase } from '@/infrastructure/supabase/client'

type GroupeRow = {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
}

const GROUPE_SELECT = 'id, name, description, created_by, created_at'

function mapGroupe(row: GroupeRow): GroupeModel {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseGroupeRepository implements GroupeRepository {
  async create(data: CreateGroupeModel): Promise<GroupeModel> {
    const { data: groupe, error } = await supabase
      .from('groupes')
      .insert({
        name: data.name,
        description: data.description ?? null,
        created_by: data.createdBy ?? null,
      })
      .select(GROUPE_SELECT)
      .single()

    if (error) throw error

    return mapGroupe(groupe as GroupeRow)
  }

  async getById(id: string): Promise<GroupeModel | null> {
    const { data, error } = await supabase
      .from('groupes')
      .select(GROUPE_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return mapGroupe(data as GroupeRow)
  }

  async list(): Promise<GroupeModel[]> {
    const { data, error } = await supabase
      .from('groupes')
      .select(GROUPE_SELECT)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as GroupeRow[]).map(mapGroupe)
  }

  async listByIds(ids: string[]): Promise<GroupeModel[]> {
    if (ids.length === 0) return []

    const { data, error } = await supabase
      .from('groupes')
      .select(GROUPE_SELECT)
      .in('id', ids)
      .order('created_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as GroupeRow[]).map(mapGroupe)
  }

  async update(id: string, data: UpdateGroupeModel): Promise<GroupeModel> {
    const { data: groupe, error } = await supabase
      .from('groupes')
      .update({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description ?? null }
          : {}),
      })
      .eq('id', id)
      .select(GROUPE_SELECT)
      .single()

    if (error) throw error

    return mapGroupe(groupe as GroupeRow)
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('groupes').delete().eq('id', id)

    if (error) throw error
  }
}
