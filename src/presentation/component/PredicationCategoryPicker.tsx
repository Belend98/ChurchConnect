import { categorieService } from '@/composition/categorie'
import type { CategorieModel } from '@/domain/entités/Categorie'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { useEffect, useState } from 'react'
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
  const [categories, setCategories] = useState<CategorieModel[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    categorieService
      .listCategories()
      .then(setCategories)
      .catch((loadError) => {
        console.warn(loadError)
        setLocalError(toErrorMessage(loadError))
      })
  }, [])

  const selectedCategoryName =
    categories.find((categorie) => categorie.id === value)?.nom ??
    (value ? 'Catégorie sélectionnée' : 'Choisir une catégorie')

  async function createCategory() {
    const nom = newCategoryName.trim()

    if (!nom) {
      setLocalError('Entre le nom de la catégorie.')
      return
    }

    setLocalError(null)
    setIsCreating(true)

    try {
      const categorie = await categorieService.createCategorie({ nom })
      setCategories((current) => [...current, categorie])
      onChange(categorie.id)
      setNewCategoryName('')
      setIsOpen(false)
    } catch (createError) {
      setLocalError(toErrorMessage(createError))
    } finally {
      setIsCreating(false)
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
                onChangeText={setNewCategoryName}
                placeholder="Nouvelle catégorie"
                placeholderTextColor={colors.outline}
                style={styles.input}
                value={newCategoryName}
              />
              <Pressable
                disabled={isCreating}
                onPress={createCategory}
                style={[styles.addButton, isCreating && styles.disabledButton]}
              >
                <Text style={styles.addButtonText}>
                  {isCreating ? 'Ajout...' : 'Ajouter'}
                </Text>
              </Pressable>
            </View>

            {localError && isOpen ? (
              <Text style={styles.errorText}>{localError}</Text>
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
    borderRadius: 12,
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
    fontWeight: '800',
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
    backgroundColor: 'rgba(3, 31, 65, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    fontSize: 21,
    fontWeight: '900',
  },
  closeText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '900',
  },
  categoryList: {
    maxHeight: 280,
  },
  categoryOption: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
  },
  categoryOptionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
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
    borderRadius: 12,
    borderWidth: 1,
    color: colors.onSurface,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
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
