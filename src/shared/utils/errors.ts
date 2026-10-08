export function toErrorMessage(error: unknown, fallback = 'Une erreur est survenue.') {
  const networkDetails = typeof error === 'object' && error !== null
    ? [Reflect.get(error, 'message'), Reflect.get(error, 'details'), Reflect.get(error, 'hint'), Reflect.get(error, 'code'), Reflect.get(error, 'name')]
    : [error]
  const networkText = networkDetails.filter((part) => typeof part === 'string').join(' ')
  if (/failed to fetch|fetch failed|network\s*(?:request\s*)?(?:failed|error)|networkerror|load failed|internet.*offline|err_(?:network|internet|connection)|econnreset|enotfound|etimedout|timed?\s*out|timeout/i.test(networkText)) {
    return 'Connexion interrompue. Vérifie ta connexion Internet, puis réessaie.'
  }

  if (error instanceof Error) return error.message

  if (typeof error === 'object' && error !== null) {
    const parts = [
      'message' in error ? error.message : undefined,
      'details' in error ? error.details : undefined,
      'hint' in error ? error.hint : undefined,
    ].filter(
      (part): part is string => typeof part === 'string' && part.trim() !== '',
    )

    if (parts.length > 0) return parts.join(' ')
  }

  if (typeof error === 'string' && error.trim() !== '') return error

  return fallback
}
