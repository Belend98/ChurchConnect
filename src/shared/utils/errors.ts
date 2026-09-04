export function toErrorMessage(error: unknown, fallback = 'Une erreur est survenue.') {
  if (error instanceof Error) return error.message

  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      details?: unknown
      hint?: unknown
      message?: unknown
    }

    const parts = [candidate.message, candidate.details, candidate.hint].filter(
      (part): part is string => typeof part === 'string' && part.trim() !== '',
    )

    if (parts.length > 0) return parts.join(' ')
  }

  if (typeof error === 'string' && error.trim() !== '') return error

  return fallback
}
