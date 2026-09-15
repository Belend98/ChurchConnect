export type UploadImageInput = {
  contentType: string
  fileName: string
  image: ArrayBuffer
  folder: string
}

export type UploadedImage = {
  path: string
  publicUrl: string
}

export interface ImageStorage {
  uploadImage(input: UploadImageInput): Promise<UploadedImage>
  deleteImage(path: string): Promise<void>
  getPathFromPublicUrl(url: string): string | null
}
