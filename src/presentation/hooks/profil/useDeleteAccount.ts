import { deleteAccountUseCase } from '@/composition/profil'
import { toErrorMessage } from '@/shared/utils/errors'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { Alert, Platform } from 'react-native'

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const isRunning = useRef(false)
  const isConfirming = useRef(false)

  async function deleteAccount() {
    if (isRunning.current) return
    isRunning.current = true
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteAccountUseCase.execute()
      router.replace('/(auth)/signin')
    } catch (error) {
      setDeleteError(toErrorMessage(error, 'Impossible de supprimer votre compte.'))
    } finally {
      isRunning.current = false
      setIsDeleting(false)
    }
  }

  function confirmDeletion() {
    if (isRunning.current || isConfirming.current) return
    const message = 'Voulez-vous supprimer votre compte ? Cette action est définitive.'

    if (Platform.OS === 'web') {
      if (window.confirm(message)) void deleteAccount()
      return
    }

    isConfirming.current = true
    Alert.alert('Supprimer mon compte', message, [
      {
        text: 'Annuler',
        style: 'cancel',
        onPress: () => { isConfirming.current = false },
      },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          isConfirming.current = false
          void deleteAccount()
        },
      },
    ], { cancelable: false })
  }

  return { isDeleting, deleteError, confirmDeletion }
}
