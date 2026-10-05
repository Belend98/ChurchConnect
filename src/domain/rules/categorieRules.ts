export function cleanCategorieName(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, ' ')
  if (!cleaned) throw new Error('Le nom de la catégorie est obligatoire.')
  return cleaned
}

export function normalizeCategorieName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}
