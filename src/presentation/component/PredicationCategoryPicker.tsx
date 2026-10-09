import { categorieService } from '@/composition/categorie'
import type { CategorieModel } from '@/domain/entities/Categorie'
import { normalizeCategorieName } from '@/domain/rules/categorieRules'
import { CATEGORIES_QUERY_KEY } from '@/presentation/queries/categorieQueries'
import { colors } from '@/shared/theme/colors'
import { toCategorieErrorMessage } from '@/shared/utils/categorieErrors'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

type PredicationCategoryPickerProps = {
  error?: string
  onChange: (value: string) => void
  value?: string
}

export function PredicationCategoryPicker({
  error,
  onChange,
  value,
}: PredicationCategoryPickerProps) {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => categorieService.listCategories(),
    staleTime: Infinity,
  })
  const [isOpen, setIsOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const createCategoryMutation = useMutation({
    mutationFn: (nom: string) => categorieService.createCategorie({ nom }),
    onSuccess: (categorie) => {
      queryClient.setQueryData<CategorieModel[]>(
        CATEGORIES_QUERY_KEY,
        (current = []) =>
          [...current.filter((item) => item.id !== categorie.id), categorie]
            .sort((a, b) => a.nom.localeCompare(b.nom)),
      )
    },
  })

  const selectedCategoryName =
    categories.find((categorie) => categorie.id === value)?.nom ??
    (value ? 'Catégorie sélectionnée' : 'Choisir une catégorie')

  async function createCategory() {
    if (createCategoryMutation.isPending) return
    const nom = newCategoryName.trim()

    if (!nom) {
      setLocalError('Entre le nom de la catégorie.')
      return
    }

    setLocalError(null)

    if (categories.some((categorie) => normalizeCategorieName(categorie.nom) === normalizeCategorieName(nom))) {
      setLocalError('Une catégorie porte déjà ce nom.')
      return
    }

    try {
      const categorie = await createCategoryMutation.mutateAsync(nom)
      onChange(categorie.id)
      setNewCategoryName('')
      setIsOpen(false)
    } catch (createError) {
      setLocalError(toCategorieErrorMessage(createError))
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setIsOpen(true)} style={styles.selectButton}>
        <Text style={value ? styles.selectText : styles.selectPlaceholder}>
          {selectedCategoryName}
        </Text>
        <Text style={styles.selectIcon}>⌄</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {localError && !isOpen ? (
        <Text style={styles.errorText}>{localError}</Text>
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catégorie</Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <Text style={styles.closeText}>Fermer</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.categoryList}>
              <Pressable
                onPress={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                style={[
                  styles.categoryOption,
                  !value && styles.categoryOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    !value && styles.categoryOptionTextActive,
                  ]}
                >
                  Aucune catégorie
                </Text>
              </Pressable>

              {categories.map((categorie) => (
                <Pressable
                  key={categorie.id}
                  onPress={() => {
                    onChange(categorie.id)
                    setIsOpen(false)
                  }}
                  style={[
                    styles.categoryOption,
                    value === categorie.id && styles.categoryOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      value === categorie.id && styles.categoryOptionTextActive,
                    ]}
                  >
                    {categorie.nom}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.createBox}>
              <TextInput
                onChangeText={(name) => {
                  setNewCategoryName(name)
                  setLocalError(null)
                }}
                placeholder="Nouvelle catégorie"
                placeholderTextColor={colors.outline}
                style={styles.input}
                value={newCategoryName}
              />
              <Pressable
                disabled={createCategoryMutation.isPending}
                onPress={createCategory}
                style={[
                  styles.addButton,
                  createCategoryMutation.isPending && styles.disabledButton,
                ]}
              >
                <Text style={styles.addButtonText}>
                  {createCategoryMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Text>
              </Pressable>
            </View>

            {localError && isOpen ? (
              <Text accessibilityRole="alert" style={styles.errorText}>{localError}</Text>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  selectButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  selectText: {
    color: colors.onSurface,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  selectPlaceholder: {
    color: colors.outline,
    flex: 1,
    fontSize: 15,
  },
  selectIcon: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '82%',
    padding: 18,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  closeText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryList: {
    maxHeight: 280,
  },
  categoryOption: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
  },
  categoryOptionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  categoryOptionTextActive: {
    color: '#ffffff',
  },
  createBox: {
    gap: 10,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.onSurface,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
})
