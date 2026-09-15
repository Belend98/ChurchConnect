import type {
  ImageStorage,
  UploadedImage,
  UploadImageInput,
} from '@/domain/repositories/ImageStorage'
import { supabase } from '@/infrastructure/supabase/client'

const IMAGE_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_IMAGE_BUCKET ?? 'church-images'
const PUBLIC_STORAGE_PATH = `/storage/v1/object/public/${IMAGE_BUCKET}/`

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildImagePath(folder: string, fileName: string): string {
  const safeFolder = folder
    .split('/')
    .map(sanitizeSegment)
    .filter(Boolean)
    .join('/')
  const safeFileName = sanitizeSegment(fileName) || 'image'

  return `${safeFolder}/${Date.now()}-${safeFileName}`
}

export class SupabaseImageStorage implements ImageStorage {
  async uploadImage(input: UploadImageInput): Promise<UploadedImage> {
    const path = buildImagePath(input.folder, input.fileName)
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(path, input.image, {
        cacheControl: '31536000',
        contentType: input.contentType,
        upsert: false,
      })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(data.path)

    return {
      path: data.path,
      publicUrl,
    }
  }

  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([path])

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
