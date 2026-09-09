import type {
  CreateMessageGroupeModel,
  MessageGroupeModel,
  UnsubscribeMessageGroupe,
} from '@/domain/entités/MessageGroupe'
import type { MessageGroupeRepository } from '@/domain/repositories/MessageGroupeRepository'
import { supabase } from '@/infrastructure/supabase/client'

type MessageGroupeRow = {
  message_id: string
  groupe_id: string
  user_id: string
  contenu: string
  created_at: string
  updated_at: string | null
}

const MESSAGE_GROUPE_SELECT =
  'message_id, groupe_id, user_id, contenu, created_at, updated_at'

function mapMessageGroupe(row: MessageGroupeRow): MessageGroupeModel {
  return {
    id: row.message_id,
    groupeId: row.groupe_id,
    userId: row.user_id,
    contenu: row.contenu,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

export class SupabaseMessageGroupeRepository
  implements MessageGroupeRepository
{
  async create(
    data: CreateMessageGroupeModel,
  ): Promise<MessageGroupeModel> {
    const { data: message, error } = await supabase
      .from('message_groupe')
      .insert({
        groupe_id: data.groupeId,
        user_id: data.userId,
        contenu: data.contenu,
      })
      .select(MESSAGE_GROUPE_SELECT)
      .single()

    if (error) throw error

    return mapMessageGroupe(message as MessageGroupeRow)
  }

  async listByGroupe(groupeId: string): Promise<MessageGroupeModel[]> {
    const { data, error } = await supabase
      .from('message_groupe')
      .select(MESSAGE_GROUPE_SELECT)
      .eq('groupe_id', groupeId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return ((data ?? []) as MessageGroupeRow[]).map(mapMessageGroupe)
  }

  subscribeToNewMessages(
    groupeId: string,
    onMessage: (message: MessageGroupeModel) => void,
  ): UnsubscribeMessageGroupe {
    const channel = supabase
      .channel(`message-groupe-${groupeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          filter: `groupe_id=eq.${groupeId}`,
          schema: 'public',
          table: 'message_groupe',
        },
        (payload) => {
          onMessage(mapMessageGroupe(payload.new as MessageGroupeRow))
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }
}
