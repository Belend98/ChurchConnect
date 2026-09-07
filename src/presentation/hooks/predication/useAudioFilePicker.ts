import { toErrorMessage } from '@/shared/utils/errors'
import * as DocumentPicker from 'expo-document-picker'
import { useState } from 'react'

export type SelectedAudioFile = {
  contentType: string
  fileName: string
  size?: number
  uri: string
}

export function useAudioFilePicker() {
  const [audioPickerError, setAudioPickerError] = useState<string | null>(null)
  const [selectedAudio, setSelectedAudio] = useState<SelectedAudioFile | null>(
    null,
  )

  async function pickAudioFile() {
    setAudioPickerError(null)

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: 'audio/*',
      })

      if (result.canceled) return

      const file = result.assets[0]

      setSelectedAudio({
        contentType: file.mimeType ?? 'audio/mpeg',
        fileName: file.name,
        size: file.size,
        uri: file.uri,
      })
    } catch (error) {
      setAudioPickerError(toErrorMessage(error))
    }
  }

  function clearAudioPickerError() {
    setAudioPickerError(null)
  }

  return {
    audioPickerError,
    clearAudioPickerError,
    pickAudioFile,
    selectedAudio,
  }
}
