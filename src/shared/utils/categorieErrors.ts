import { toErrorMessage } from '@/shared/utils/errors'

export function toCategorieErrorMessage(error: unknown, fallback = 'Impossible de créer cette catégorie.') {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
    return 'Une catégorie porte déjà ce nom.'
  }
  return toErrorMessage(error, fallback)
}
