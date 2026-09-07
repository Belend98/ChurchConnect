import type {
  PredicationAudioStorage,
  UploadedPredicationAudio,
  UploadPredicationAudioInput,
} from '@/domain/repositories/PredicationAudioStorage'
import { supabase } from '@/infrastructure/supabase/client'

const PREDICATION_AUDIO_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_PREDICATION_AUDIO_BUCKET ??
  'predications-audio'
const PUBLIC_STORAGE_PATH = `/storage/v1/object/public/${PREDICATION_AUDIO_BUCKET}/`

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildAudioPath(fileName: string): string {
  const safeFileName = sanitizeFileName(fileName) || 'predication-audio'
  return `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeFileName}`
}

export class SupabasePredicationAudioStorage
  implements PredicationAudioStorage
{
  async uploadAudio(
    input: UploadPredicationAudioInput,
  ): Promise<UploadedPredicationAudio> {
    const path = buildAudioPath(input.fileName)
    const { data, error } = await supabase.storage
      .from(PREDICATION_AUDIO_BUCKET)
      .upload(path, input.audio, {
        cacheControl: '31536000',
        contentType: input.contentType,
        upsert: false,
      })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(PREDICATION_AUDIO_BUCKET)
      .getPublicUrl(data.path)

    return {
      path: data.path,
      publicUrl,
    }
  }

  async deleteAudio(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(PREDICATION_AUDIO_BUCKET)
      .remove([path])

    if (error) throw error
  }

  getPathFromPublicUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url)
      const storagePathIndex = parsedUrl.pathname.indexOf(PUBLIC_STORAGE_PATH)

      if (storagePathIndex === -1) return null

      const path = parsedUrl.pathname.slice(
        storagePathIndex + PUBLIC_STORAGE_PATH.length,
      )

      return decodeURIComponent(path)
    } catch {
      return null
    }
  }
}
