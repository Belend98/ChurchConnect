import { toErrorMessage } from '@/shared/utils/errors'
import * as DocumentPicker from 'expo-document-picker'
import { useState } from 'react'

export type SelectedImageFile = {
  contentType: string
  fileName: string
  size?: number
  uri: string
}

export function useImageFilePicker() {
  const [imagePickerError, setImagePickerError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<SelectedImageFile | null>(
    null,
  )

  async function pickImageFile() {
    setImagePickerError(null)

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: 'image/*',
      })

      if (result.canceled) return

      const file = result.assets[0]

      setSelectedImage({
        contentType: file.mimeType ?? 'image/jpeg',
        fileName: file.name,
        size: file.size,
        uri: file.uri,
      })
    } catch (error) {
      setImagePickerError(toErrorMessage(error))
    }
  }

  function clearImagePickerError() {
    setImagePickerError(null)
  }

  return {
    clearImagePickerError,
    imagePickerError,
    pickImageFile,
    selectedImage,
  }
}
