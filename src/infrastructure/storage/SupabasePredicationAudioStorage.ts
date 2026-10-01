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
    if (input.onProgress) {
      await this.uploadWithProgress(path, input)
      const { data: { publicUrl } } = supabase.storage
        .from(PREDICATION_AUDIO_BUCKET)
        .getPublicUrl(path)

      return { path, publicUrl }
    }

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

  private async uploadWithProgress(
    path: string,
    input: UploadPredicationAudioInput,
  ): Promise<void> {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) throw new Error('Reconnecte-toi pour envoyer un fichier audio.')

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!.replace(/\/$/, '')
    const objectPath = [PREDICATION_AUDIO_BUCKET, ...path.split('/')]
      .map(encodeURIComponent)
      .join('/')

    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.open('POST', `${baseUrl}/storage/v1/object/${objectPath}`)
      request.setRequestHeader('apikey', process.env.EXPO_PUBLIC_SUPABASE_KEY!)
      request.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      request.setRequestHeader('Content-Type', input.contentType)
      request.setRequestHeader('Cache-Control', 'max-age=31536000')
      request.setRequestHeader('x-upsert', 'false')
      request.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          input.onProgress?.(Math.min(0.99, event.loaded / event.total))
        }
      }
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          input.onProgress?.(1)
          resolve()
          return
        }

        let message = "Impossible d'envoyer le fichier audio."
        try {
          const response = JSON.parse(request.responseText)
          if (typeof response.message === 'string') message = response.message
        } catch {
          // Keep the fallback message when the server response is not JSON.
        }
        reject(new Error(message))
      }
      request.onerror = () => reject(new Error("L'envoi a échoué. Vérifie ta connexion."))
      request.onabort = () => reject(new Error("L'envoi du fichier audio a été annulé."))
      input.onProgress?.(0)
      request.send(input.audio)
    })
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
