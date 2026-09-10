import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { PredicationComponent } from '@/presentation/component/PredicationComponent'
import { categorieService } from '@/composition/categorie'
import { predicationService } from '@/composition/predication'
import { profilService } from '@/composition/profil'
import type { CategorieModel } from '@/domain/entités/Categorie'
import type { PredicationModel } from '@/domain/entités/Predication'
import { canManagePredications } from '@/domain/entités/Profil'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'

const ALL_CATEGORIES_FILTER = 'all'

export default function PredicationScreen() {
  const [categories, setCategories] = useState<CategorieModel[]>([])
  const [categoryActionId, setCategoryActionId] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [predications, setPredications] = useState<PredicationModel[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [favoriteById, setFavoriteById] = useState<Record<string, boolean>>({})
  const [favoritingId, setFavoritingId] = useState<string | null>(null)
  const [canManagePredicationItems, setCanManagePredicationItems] =
    useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [likedById, setLikedById] = useState<Record<string, boolean>>({})
  const [likesById, setLikesById] = useState<Record<string, number>>({})
  const [likingId, setLikingId] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    ALL_CATEGORIES_FILTER,
  )

  const loadCategories = useCallback(async () => {
    const items = await categorieService.listCategories()
    setCategories(items)
    return items
  }, [])

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      setIsLoading(true)

      async function loadScreen() {
        const [items, categoryItems, profile] = await Promise.all([
          predicationService.listPredications(),
          categorieService.listCategories(),
          profilService.getCurrentUserProfileOrThrow().catch(() => null),
        ])

        if (!isMounted) return

        setPredications(items)
        setCategories(categoryItems)
        setCanManagePredicationItems(canManagePredications(profile?.roleApp))

        const engagementEntries = await Promise.all(
          items.map(async (item) => {
            const [likes, isFavorite, isLiked] = await Promise.all([
              predicationService.countLikes(item.id),
              predicationService.isFavoriteByCurrentUser(item.id),
              predicationService.isLikedByCurrentUser(item.id),
            ])

            return [item.id, { isFavorite, isLiked, likes }] as const
          }),
        )

        if (!isMounted) return

        setLikedById(
          Object.fromEntries(
            engagementEntries.map(([id, engagement]) => [
              id,
              engagement.isLiked,
            ]),
          ),
        )
        setFavoriteById(
          Object.fromEntries(
            engagementEntries.map(([id, engagement]) => [
              id,
              engagement.isFavorite,
            ]),
          ),
        )
        setLikesById(
          Object.fromEntries(
            engagementEntries.map(([id, engagement]) => [
              id,
              engagement.likes,
            ]),
          ),
        )
      }

      loadScreen()
        .catch((error) => {
          if (!isMounted) return
          console.warn(error)
          setCategories([])
          setPredications([])
          setFavoriteById({})
          setLikedById({})
          setLikesById({})
          setCanManagePredicationItems(false)
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })

      return () => {
        isMounted = false
      }
    }, []),
  )

  function openPlayer(predication: PredicationModel) {
    router.push(
      {
        pathname: '/predication-player',
        params: {
          durationSeconds: String(predication.durationSeconds ?? ''),
          id: predication.id,
          mediaUrl: predication.mediaUrl,
          serie: getCategoryName(predication.categorieId),
          title: predication.title,
        },
      } as never,
    )
  }

  function getCategoryName(categorieId?: string): string {
    if (!categorieId) return 'Prédication'
    return (
      categories.find((categorie) => categorie.id === categorieId)?.nom ??
      'Prédication'
    )
  }

  async function createCategory() {
    const trimmedName = newCategoryName.trim()

    setCategoryError(null)

    if (!trimmedName) {
      setCategoryError('Le nom de la catégorie est obligatoire.')
      return
    }

    setCategoryActionId('new')

    try {
      await categorieService.createCategorie({ nom: trimmedName })
      await loadCategories()
      setNewCategoryName('')
    } catch (error) {
      setCategoryError(
        toErrorMessage(error, 'Impossible de créer cette catégorie.'),
      )
    } finally {
      setCategoryActionId(null)
    }
  }

  function startEditCategory(categorie: CategorieModel) {
    setCategoryError(null)
    setEditingCategoryId(categorie.id)
    setEditingCategoryName(categorie.nom)
  }

  async function updateCategory(categorieId: string) {
    const trimmedName = editingCategoryName.trim()

    setCategoryError(null)

    if (!trimmedName) {
      setCategoryError('Le nom de la catégorie est obligatoire.')
      return
    }

    setCategoryActionId(categorieId)

    try {
      await categorieService.updateCategorie(categorieId, { nom: trimmedName })
      await loadCategories()
      setEditingCategoryId(null)
      setEditingCategoryName('')
    } catch (error) {
      setCategoryError(
        toErrorMessage(error, 'Impossible de modifier cette catégorie.'),
      )
    } finally {
      setCategoryActionId(null)
    }
  }

  function confirmDeleteCategory(categorie: CategorieModel) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Voulez-vous vraiment supprimer "${categorie.nom}" ?`,
      )

      if (confirmed) void deleteCategory(categorie.id)
      return
    }

    Alert.alert(
      'Supprimer la catégorie',
      `Voulez-vous vraiment supprimer "${categorie.nom}" ?`,
      [
        { style: 'cancel', text: 'Annuler' },
        {
          onPress: () => deleteCategory(categorie.id),
          style: 'destructive',
          text: 'Supprimer',
        },
      ],
    )
  }

  async function deleteCategory(categorieId: string) {
    setCategoryActionId(categorieId)
    setCategoryError(null)

    try {
      await categorieService.deleteCategorie(categorieId)
      await loadCategories()

      if (selectedCategoryId === categorieId) {
        setSelectedCategoryId(ALL_CATEGORIES_FILTER)
      }
    } catch (error) {
      setCategoryError(
        toErrorMessage(
          error,
          'Impossible de supprimer cette catégorie. Elle est peut-être utilisée.',
        ),
      )
    } finally {
      setCategoryActionId(null)
    }
  }

  function openUpdate(predication: PredicationModel) {
    router.push(
      {
        pathname: '/update-predication',
        params: {
          categorieId: predication.categorieId ?? '',
          durationSeconds: String(predication.durationSeconds ?? ''),
          id: predication.id,
          mediaUrl: predication.mediaUrl,
          title: predication.title,
        },
      } as never,
    )
  }

  function confirmDelete(predication: PredicationModel) {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Voulez-vous vraiment supprimer "${predication.title}" ?`,
      )

      if (confirmed) void deletePredication(predication)
      return
    }

    Alert.alert(
      'Supprimer la prédication',
      `Voulez-vous vraiment supprimer "${predication.title}" ?`,
      [
        { style: 'cancel', text: 'Annuler' },
        {
          onPress: () => deletePredication(predication),
          style: 'destructive',
          text: 'Supprimer',
        },
      ],
    )
  }

  async function deletePredication(predication: PredicationModel) {
    setDeletingId(predication.id)

    try {
      await predicationService.deletePredication(predication.id)
      setPredications((current) =>
        current.filter((item) => item.id !== predication.id),
      )
    } catch (error) {
      console.warn(error)
      Alert.alert(
        'Suppression impossible',
        toErrorMessage(error, "Une erreur est survenue pendant la suppression."),
      )
    } finally {
      setDeletingId(null)
    }
  }

  async function toggleLike(predication: PredicationModel) {
    if (likingId) return

    const wasLiked = Boolean(likedById[predication.id])

    setLikingId(predication.id)
    setLikedById((current) => ({
      ...current,
      [predication.id]: !wasLiked,
    }))
    setLikesById((current) => ({
      ...current,
      [predication.id]: Math.max(0, (current[predication.id] ?? 0) + (wasLiked ? -1 : 1)),
    }))

    try {
      const isLiked = await predicationService.toggleLike(predication.id)
      const likes = await predicationService.countLikes(predication.id)

      setLikedById((current) => ({
        ...current,
        [predication.id]: isLiked,
      }))
      setLikesById((current) => ({
        ...current,
        [predication.id]: likes,
      }))
    } catch (error) {
      console.warn(error)
      setLikedById((current) => ({
        ...current,
        [predication.id]: wasLiked,
      }))
      setLikesById((current) => ({
        ...current,
        [predication.id]: Math.max(0, (current[predication.id] ?? 0) + (wasLiked ? 1 : -1)),
      }))
      Alert.alert(
        'Like impossible',
        toErrorMessage(error, "Une erreur est survenue pendant le like."),
      )
    } finally {
      setLikingId(null)
    }
  }

  async function toggleFavorite(predication: PredicationModel) {
    if (favoritingId) return

    const wasFavorite = Boolean(favoriteById[predication.id])

    setFavoritingId(predication.id)
    setFavoriteById((current) => ({
      ...current,
      [predication.id]: !wasFavorite,
    }))

    try {
      const isFavorite = await predicationService.toggleFavorite(predication.id)

      setFavoriteById((current) => ({
        ...current,
        [predication.id]: isFavorite,
      }))
    } catch (error) {
      console.warn(error)
      setFavoriteById((current) => ({
        ...current,
        [predication.id]: wasFavorite,
      }))
      Alert.alert(
        'Favori impossible',
        toErrorMessage(error, "Une erreur est survenue pendant l'ajout favori."),
      )
    } finally {
      setFavoritingId(null)
    }
  }

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredPredications = predications.filter((predication) => {
    const categoryName = getCategoryName(predication.categorieId)
    const matchesCategory =
      selectedCategoryId === ALL_CATEGORIES_FILTER ||
      predication.categorieId === selectedCategoryId
    const matchesSearch =
      !normalizedSearch ||
      predication.title.toLowerCase().includes(normalizedSearch) ||
      categoryName.toLowerCase().includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Médiathèque spirituelle</Text>
          <Text style={styles.title}>Prédications</Text>
        </View>
        {canManagePredicationItems ? (
          <Pressable
            onPress={() => router.push('/create-predication' as never)}
            style={styles.sortButton}
          >
            <Text style={styles.sortButtonText}>Créer</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            onChangeText={setSearchQuery}
            placeholder="Thème, titre, catégorie..."
            placeholderTextColor={colors.outline}
            style={styles.searchInput}
            value={searchQuery}
          />
        </View>
        {canManagePredicationItems ? (
          <Pressable
            onPress={() => setIsCategoryModalOpen(true)}
            style={styles.filterButton}
          >
            <Text style={styles.filterButtonText}>≡</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.filterList}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {[{ id: ALL_CATEGORIES_FILTER, nom: 'Tous' }, ...categories].map((filter) => (
          <Pressable
            key={filter.id}
            onPress={() => setSelectedCategoryId(filter.id)}
            style={[
              styles.filterPill,
              selectedCategoryId === filter.id && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategoryId === filter.id && styles.filterTextActive,
              ]}
            >
              {selectedCategoryId === filter.id ? (
                <Text style={styles.filterCheck}>✓</Text>
              ) : null}
              {filter.nom}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Toutes les prédications</Text>
        <Text style={styles.sectionMeta}>
          {isLoading ? 'Chargement' : `${filteredPredications.length} messages`}
        </Text>
      </View>

      <View style={styles.sermonList}>
        {filteredPredications.map((predication) => (
          <PredicationComponent
            canManagePredication={canManagePredicationItems}
            categoryName={getCategoryName(predication.categorieId)}
            isDeleting={deletingId === predication.id}
            isFavorite={Boolean(favoriteById[predication.id])}
            isFavoriting={favoritingId === predication.id}
            isLiked={Boolean(likedById[predication.id])}
            isLiking={likingId === predication.id}
            key={predication.id}
            likes={likesById[predication.id] ?? 0}
            onDelete={confirmDelete}
            onEdit={openUpdate}
            onListen={openPlayer}
            onToggleFavorite={toggleFavorite}
            onToggleLike={toggleLike}
            predication={predication}
          />
        ))}
      </View>

      {!isLoading && filteredPredications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucune prédication</Text>
          <Text style={styles.emptyText}>
            Aucune prédication ne correspond à ce filtre.
          </Text>
        </View>
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={() => setIsCategoryModalOpen(false)}
        transparent
        visible={isCategoryModalOpen}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catégories</Text>
              <Pressable onPress={() => setIsCategoryModalOpen(false)}>
                <Text style={styles.modalClose}>Fermer</Text>
              </Pressable>
            </View>

            <View style={styles.categoryCreateRow}>
              <TextInput
                onChangeText={setNewCategoryName}
                placeholder="Nouvelle catégorie"
                placeholderTextColor={colors.outline}
                style={styles.categoryInput}
                value={newCategoryName}
              />
              <Pressable
                disabled={categoryActionId === 'new'}
                onPress={createCategory}
                style={[
                  styles.smallActionButton,
                  categoryActionId === 'new' && styles.disabledButton,
                ]}
              >
                <Text style={styles.smallActionButtonText}>Ajouter</Text>
              </Pressable>
            </View>

            {categoryError ? (
              <Text style={styles.errorText}>{categoryError}</Text>
            ) : null}

            <ScrollView
              contentContainerStyle={styles.categoryList}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((categorie) => {
                const isEditing = editingCategoryId === categorie.id
                const isBusy = categoryActionId === categorie.id

                return (
                  <View key={categorie.id} style={styles.categoryRow}>
                    {isEditing ? (
                      <TextInput
                        autoFocus
                        onChangeText={setEditingCategoryName}
                        placeholder="Nom"
                        placeholderTextColor={colors.outline}
                        style={styles.categoryInput}
                        value={editingCategoryName}
                      />
                    ) : (
                      <Text numberOfLines={1} style={styles.categoryName}>
                        {categorie.nom}
                      </Text>
                    )}

                    {isEditing ? (
                      <Pressable
                        disabled={isBusy}
                        onPress={() => updateCategory(categorie.id)}
                        style={[
                          styles.iconActionButton,
                          isBusy && styles.disabledButton,
                        ]}
                      >
                        <Text style={styles.iconActionText}>✓</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        disabled={isBusy}
                        onPress={() => startEditCategory(categorie)}
                        style={styles.iconActionButton}
                      >
                        <Text style={styles.iconActionText}>✎</Text>
                      </Pressable>
                    )}

                    <Pressable
                      disabled={isBusy}
                      onPress={() => confirmDeleteCategory(categorie)}
                      style={[
                        styles.iconDangerButton,
                        isBusy && styles.disabledButton,
                      ]}
                    >
                      <Text style={styles.iconDangerText}>×</Text>
                    </Pressable>
                  </View>
                )
              })}

              {categories.length === 0 ? (
                <Text style={styles.modalText}>Aucune catégorie pour le moment.</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: 16,
    maxWidth: 520,
    padding: 20,
    paddingBottom: 96,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  sortButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  sortButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  manageButton: {
    alignSelf: 'flex-start',
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  manageButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchIcon: {
    color: colors.onSurfaceVariant,
    fontSize: 22,
    fontWeight: '700',
  },
  searchInput: {
    color: colors.onSurface,
    flex: 1,
    fontSize: 15,
    minHeight: 50,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  filterButtonText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 27,
  },
  filterList: {
    gap: 8,
    paddingRight: 18,
  },
  filterPill: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  filterPillActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterCheck: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  resumeCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  resumeLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  resumeTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  resumeMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    marginTop: 3,
  },
  resumeButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  resumeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  sectionMeta: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  sermonList: {
    gap: 14,
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  modalOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: 14,
    maxHeight: '86%',
    padding: 18,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  modalClose: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  categoryCreateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  categoryInput: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.onSurface,
    flex: 1,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  smallActionButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  smallActionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryList: {
    gap: 10,
    paddingBottom: 6,
  },
  categoryRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  categoryName: {
    color: colors.onSurface,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  iconActionButton: {
    alignItems: 'center',
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconActionText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 20,
  },
  iconDangerButton: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconDangerText: {
    color: colors.error,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  },
  disabledButton: {
    opacity: 0.55,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
})
