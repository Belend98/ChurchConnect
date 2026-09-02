export function toErrorMessage(error: unknown, fallback = 'Une erreur est survenue.') {
  if (error instanceof Error) return error.message
  return fallback
}

