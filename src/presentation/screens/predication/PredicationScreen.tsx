import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { toCategorieErrorMessage } from '@/shared/utils/categorieErrors'
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
import { ListCount } from '@/presentation/component/ListCount'
import { categorieService } from '@/composition/categorie'
import { predicationService } from '@/composition/predication'
import type { CategorieModel } from '@/domain/entités/Categorie'
import { normalizeCategorieName } from '@/domain/rules/categorieRules'
import type { PredicationModel } from '@/domain/entités/Predication'
import { canManagePredications } from '@/domain/entités/Profil'
import { usePredications } from '@/presentation/hooks/predication/usePredications'
import { usePredicationFavorites } from '@/presentation/hooks/predication/usePredicationFavorites'
import { usePredicationLikes } from '@/presentation/hooks/predication/usePredicationLikes'
import { useTogglePredicationLike } from '@/presentation/hooks/predication/useTogglePredicationLike'
import { useTogglePredicationFavorite } from '@/presentation/hooks/predication/useTogglePredicationFavorite'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { CATEGORIES_QUERY_KEY } from '@/presentation/queries/categorieQueries'
import { PREDICATIONS_QUERY_KEY } from '@/presentation/queries/predicationQueries'
import { router } from 'expo-router'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

const ALL_CATEGORIES_FILTER = 'all'
const EMPTY_PREDICATIONS: PredicationModel[] = []

export default function PredicationScreen() {
  const [categoryActionId, setCategoryActionId] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const { data: profile, isError: isProfileError } = useCurrentProfile()
  const canManagePredicationItems = !isProfileError && canManagePredications(profile?.roleApp)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    ALL_CATEGORIES_FILTER,
  )
  const queryClient = useQueryClient()
  const {
    data: predications = EMPTY_PREDICATIONS,
    error: predicationsError,
    isError: isPredicationsError,
    isLoading,
  } = usePredications()
  const { likesById, error: likesError } = usePredicationLikes(predications)
  const toggleLikeMutation = useTogglePredicationLike()
  const { data: favoriteIds = [] } = usePredicationFavorites()
  const favoriteIdSet = new Set(favoriteIds)
  const toggleFavoriteMutation = useTogglePredicationFavorite()
  const { data: categories = [], isPending: isLoadingCategories, error: categoriesError } = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const result = await categorieService.listCategories()
      if (signal.aborted) throw new Error('Chargement des catégories annulé.')
      return result
    },
    staleTime: Infinity,
  })

  const createCategoryMutation = useMutation({
    mutationFn: (nom: string) => categorieService.createCategorie({ nom }),
    onMutate: () => queryClient.cancelQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    onSuccess: (categorie) => {
      queryClient.setQueryData<CategorieModel[]>(
        CATEGORIES_QUERY_KEY,
        (current = []) =>
          [...current.filter((item) => item.id !== categorie.id), categorie]
            .sort((a, b) => a.nom.localeCompare(b.nom)),
      )
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, nom }: { id: string; nom: string }) =>
      categorieService.updateCategorie(id, { nom }),
    onMutate: () => queryClient.cancelQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    onSuccess: (categorie) => {
      queryClient.setQueryData<CategorieModel[]>(
        CATEGORIES_QUERY_KEY,
        (current = []) =>
          current
            .map((item) => (item.id === categorie.id ? categorie : item))
            .sort((a, b) => a.nom.localeCompare(b.nom)),
      )
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categorieService.deleteCategorie(id),
    onMutate: () => queryClient.cancelQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY }),
    onSuccess: (_result, categorieId) => {
      queryClient.setQueryData<CategorieModel[]>(
        CATEGORIES_QUERY_KEY,
        (current = []) => current.filter((item) => item.id !== categorieId),
      )

      if (selectedCategoryId === categorieId) {
        setSelectedCategoryId(ALL_CATEGORIES_FILTER)
      }
      queryClient.setQueryData<PredicationModel[]>(PREDICATIONS_QUERY_KEY, (current) =>
        current?.map((item) => item.categorieId === categorieId ? { ...item, categorieId: undefined } : item),
      )
      if (editingCategoryId === categorieId) setEditingCategoryId(null)
      void queryClient.invalidateQueries({ queryKey: PREDICATIONS_QUERY_KEY })
    },
  })

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
      },
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
    if (categoryActionId || !canManagePredicationItems) return
    const trimmedName = newCategoryName.trim()

    setCategoryError(null)

    if (!trimmedName) {
      setCategoryError('Le nom de la catégorie est obligatoire.')
      return
    }

    setCategoryActionId('new')

    try {
      await createCategoryMutation.mutateAsync(trimmedName)
      setNewCategoryName('')
    } catch (error) {
      setCategoryError(
        toCategorieErrorMessage(error, 'Impossible de créer cette catégorie.'),
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
    if (categoryActionId || !canManagePredicationItems) return
    const trimmedName = editingCategoryName.trim()

    setCategoryError(null)

    if (!trimmedName) {
      setCategoryError('Le nom de la catégorie est obligatoire.')
      return
    }

    setCategoryActionId(categorieId)

    try {
      await updateCategoryMutation.mutateAsync({
        id: categorieId,
        nom: trimmedName,
      })
      setEditingCategoryId(null)
      setEditingCategoryName('')
    } catch (error) {
      setCategoryError(
        toCategorieErrorMessage(error, 'Impossible de modifier cette catégorie.'),
      )
    } finally {
      setCategoryActionId(null)
    }
  }

  function confirmDeleteCategory(categorie: CategorieModel) {
    if (categoryActionId || !canManagePredicationItems) return
    const message = `Supprimer « ${categorie.nom} » ? Les prédications seront conservées sans catégorie.`
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        message,
      )

      if (confirmed) void deleteCategory(categorie.id)
      return
    }

    Alert.alert(
      'Supprimer la catégorie',
      message,
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
    if (categoryActionId || !canManagePredicationItems) return
    setCategoryActionId(categorieId)
    setCategoryError(null)

    try {
      await deleteCategoryMutation.mutateAsync(categorieId)
    } catch (error) {
      setCategoryError(
        toErrorMessage(
          error,
          'Impossible de supprimer cette catégorie.',
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
          id: predication.id,
          mediaUrl: predication.mediaUrl,
          title: predication.title,
        },
      },
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
      queryClient.setQueryData<PredicationModel[]>(
        PREDICATIONS_QUERY_KEY,
        (current = []) =>
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
    if (toggleLikeMutation.isPending) return
    try {
      await toggleLikeMutation.mutateAsync(predication.id)
    } catch (error) {
      console.warn(error)
      Alert.alert('Like impossible', toErrorMessage(error, 'Une erreur est survenue pendant le like.'))
    }
  }

  async function toggleFavorite(predication: PredicationModel) {
    if (toggleFavoriteMutation.isPending) return

    try {
      await toggleFavoriteMutation.mutateAsync(predication.id)
    } catch (error) {
      console.warn(error)
      Alert.alert(
        'Favori impossible',
        toErrorMessage(error, "Une erreur est survenue pendant l'ajout favori."),
      )
    }
  }

  const visibleCategories = categories.filter((categorie) =>
    normalizeCategorieName(categorie.nom).includes(normalizeCategorieName(categorySearch)),
  )
  const effectiveCategoryId = categories.some((categorie) => categorie.id === selectedCategoryId)
    ? selectedCategoryId : ALL_CATEGORIES_FILTER
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredPredications = predications.filter((predication) => {
    const categoryName = getCategoryName(predication.categorieId)
    const matchesCategory =
      effectiveCategoryId === ALL_CATEGORIES_FILTER ||
      predication.categorieId === effectiveCategoryId
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
          <Text style={styles.title}>Prédications</Text>
        </View>
        {canManagePredicationItems ? (
          <Pressable
            onPress={() => router.push('/create-predication')}
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
            placeholder="Titre de la prédication"
            placeholderTextColor={colors.outline}
            style={styles.searchInput}
            value={searchQuery}
          />
        </View>
        {canManagePredicationItems ? (
          <Pressable
            onPress={() => setIsCategoryModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Gérer les catégories"
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
              effectiveCategoryId === filter.id && styles.filterPillActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                effectiveCategoryId === filter.id && styles.filterTextActive,
              ]}
            >
              {effectiveCategoryId === filter.id ? (
                <Text style={styles.filterCheck}>✓</Text>
              ) : null}
              {filter.nom}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Toutes les prédications</Text>
        {!isLoading && !isPredicationsError ? <ListCount count={filteredPredications.length} label="prédications affichées" /> : null}
      </View>

      {isPredicationsError ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Chargement impossible</Text>
          <Text style={styles.emptyText}>
            {toErrorMessage(
              predicationsError,
              'Impossible de charger les prédications.',
            )}
          </Text>
        </View>
      ) : null}

      {likesError ? (
        <Text accessibilityRole="alert" style={styles.emptyText}>
          {toErrorMessage(likesError, 'Impossible de charger les likes.')}
        </Text>
      ) : null}

      <View style={styles.sermonList}>
        {filteredPredications.map((predication) => (
          <PredicationComponent
            canManagePredication={canManagePredicationItems}
            categoryName={categories.find((categorie) => categorie.id === predication.categorieId)?.nom}
            isDeleting={deletingId === predication.id}
            isFavorite={favoriteIdSet.has(predication.id)}
            isFavoriting={toggleFavoriteMutation.isPending && toggleFavoriteMutation.variables === predication.id}
            isLiked={Boolean(likesById[predication.id]?.isLiked)}
            isLiking={toggleLikeMutation.isPending && toggleLikeMutation.variables === predication.id}
            key={predication.id}
            likes={likesById[predication.id]?.count ?? 0}
            onDelete={confirmDelete}
            onEdit={openUpdate}
            onListen={openPlayer}
            onToggleFavorite={toggleFavorite}
            onToggleLike={toggleLike}
            predication={predication}
          />
        ))}
      </View>

      {!isLoading && !isPredicationsError && filteredPredications.length === 0 ? (
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
        visible={isCategoryModalOpen && canManagePredicationItems}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text accessibilityRole="header" style={styles.modalTitle}>Catégories</Text>
              <Pressable accessibilityRole="button" onPress={() => setIsCategoryModalOpen(false)}>
                <Text style={styles.modalClose}>Fermer</Text>
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Rechercher une catégorie par nom"
              autoCorrect={false}
              onChangeText={setCategorySearch}
              placeholder="Rechercher par nom"
              placeholderTextColor={colors.onSurfaceVariant}
              style={styles.categorySearchInput}
              value={categorySearch}
            />
            <View style={styles.categoryCreateRow}>
              <TextInput
                accessibilityLabel={editingCategoryId ? 'Renommer la catégorie' : 'Nom de la nouvelle catégorie'}
                editable={!categoryActionId}
                onChangeText={editingCategoryId ? setEditingCategoryName : setNewCategoryName}
                onSubmitEditing={() => editingCategoryId ? void updateCategory(editingCategoryId) : void createCategory()}
                placeholder={editingCategoryId ? 'Nouveau nom' : 'Nouvelle catégorie'}
                placeholderTextColor={colors.onSurfaceVariant}
                returnKeyType="done"
                style={styles.categoryInput}
                value={editingCategoryId ? editingCategoryName : newCategoryName}
              />
              <Pressable
                accessibilityRole="button"
                disabled={Boolean(categoryActionId)}
                onPress={() => editingCategoryId ? void updateCategory(editingCategoryId) : void createCategory()}
                style={[styles.smallActionButton, Boolean(categoryActionId) && styles.disabledButton]}
              >
                <Text style={styles.smallActionButtonText}>
                  {categoryActionId ? '…' : editingCategoryId ? 'Enregistrer' : 'Ajouter'}
                </Text>
              </Pressable>
            </View>
            {editingCategoryId ? (
              <Pressable accessibilityRole="button" disabled={Boolean(categoryActionId)} onPress={() => {
                setEditingCategoryId(null)
                setEditingCategoryName('')
                setCategoryError(null)
              }}>
                <Text style={styles.modalClose}>Annuler le renommage</Text>
              </Pressable>
            ) : null}
            {categoryError || categoriesError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {categoryError ?? toErrorMessage(categoriesError, 'Impossible de charger les catégories.')}
              </Text>
            ) : null}
            <ScrollView
              contentContainerStyle={styles.categoryList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {visibleCategories.map((categorie) => (
                <View key={categorie.id} style={styles.categoryRow}>
                  <Text numberOfLines={1} style={styles.categoryName}>{categorie.nom}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={'Renommer ' + categorie.nom}
                    disabled={Boolean(categoryActionId)}
                    onPress={() => startEditCategory(categorie)}
                    style={[styles.iconActionButton, Boolean(categoryActionId) && styles.disabledButton]}
                  >
                    <Text style={styles.iconActionText}>Renommer</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={'Supprimer ' + categorie.nom}
                    disabled={Boolean(categoryActionId)}
                    onPress={() => confirmDeleteCategory(categorie)}
                    style={[styles.iconDangerButton, Boolean(categoryActionId) && styles.disabledButton]}
                  >
                    <Text style={styles.iconDangerText}>Supprimer</Text>
                  </Pressable>
                </View>
              ))}
              {isLoadingCategories ? <Text style={styles.modalText}>Chargement…</Text> : null}
              {!isLoadingCategories && !categoriesError && visibleCategories.length === 0 ? (
                <Text style={styles.modalText}>
                  {categories.length ? 'Aucun résultat.' : 'Aucune catégorie.'}
                </Text>
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
    gap: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    flexShrink: 1,
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
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
    alignSelf: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: 14,
    maxHeight: '78%',
    maxWidth: 520,
    width: '100%',
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
  categorySearchInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    color: colors.onSurface,
    fontSize: 14,
    minHeight: 40,
    paddingHorizontal: 12,
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
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  iconActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 20,
  },
  iconDangerButton: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  iconDangerText: {
    color: colors.error,
    fontSize: 12,
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
