export type UploadPredicationAudioInput = {
  fileName: string
  contentType: string
  audio: ArrayBuffer
  onProgress?: (progress: number) => void
}

export type UploadedPredicationAudio = {
  path: string
  publicUrl: string
}

export interface PredicationAudioStorage {
  uploadAudio(input: UploadPredicationAudioInput): Promise<UploadedPredicationAudio>
  deleteAudio(path: string): Promise<void>
  getPathFromPublicUrl(url: string): string | null
}
