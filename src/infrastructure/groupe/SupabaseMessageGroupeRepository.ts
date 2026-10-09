import type {
  CreateMessageGroupeModel,
  MessageGroupeModel,
  UnsubscribeMessageGroupe,
} from '@/domain/entities/MessageGroupe'
import type { MessageGroupeRepository } from '@/domain/repositories/MessageGroupeRepository'
import { supabase } from '@/infrastructure/supabase/client'

type MessageGroupeRow = {
  message_id: string
  groupe_id: string
  user_id: string | null
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
        ...(data.id ? { message_id: data.id } : {}),
        groupe_id: data.groupeId,
        user_id: data.userId,
        contenu: data.contenu,
      })
      .select(MESSAGE_GROUPE_SELECT)
      .single()

    // Une réponse perdue peut laisser un message déjà enregistré : le retrouver
    // avec le même identifiant évite un second message et une seconde notification.
    if (error?.code === '23505' && data.id) {
      const { data: existing, error: lookupError } = await supabase
        .from('message_groupe')
        .select(MESSAGE_GROUPE_SELECT)
        .eq('message_id', data.id)
        .eq('groupe_id', data.groupeId)
        .eq('user_id', data.userId)
        .eq('contenu', data.contenu)
        .single()
      if (lookupError) throw lookupError
      return mapMessageGroupe(existing)
    }
    if (error) throw error

    return mapMessageGroupe(message)
  }

  async listByGroupe(groupeId: string): Promise<MessageGroupeModel[]> {
    const { data, error } = await supabase
      .from('message_groupe')
      .select(MESSAGE_GROUPE_SELECT)
      .eq('groupe_id', groupeId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data ?? []).map(mapMessageGroupe)
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
