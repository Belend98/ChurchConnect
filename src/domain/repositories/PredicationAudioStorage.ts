export type UploadPredicationAudioInput = {
  fileName: string
  contentType: string
  audio: ArrayBuffer
}

export type UploadedPredicationAudio = {
  path: string
  publicUrl: string
}

export interface PredicationAudioStorage {
  uploadAudio(input: UploadPredicationAudioInput): Promise<UploadedPredicationAudio>
  deleteAudio(path: string): Promise<void>
}
