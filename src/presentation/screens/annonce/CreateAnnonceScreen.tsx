import { annonceService } from '@/composition/annonce'
import type { CreateAnnonceModel } from '@/domain/entités/Annonce'
import { canManagePredications } from '@/domain/entités/Profil'
import { useCurrentUserId } from '@/presentation/hooks/auth/useCurrentUserId'
import { useCurrentProfile } from '@/presentation/hooks/profil/useCurrentProfile'
import { annoncesQueryKey, applyAnnonceChange } from '@/presentation/queries/annonceQueries'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export default function CreateAnnonceScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const annonceId = Array.isArray(params.id) ? params.id[0] : params.id
  const isEditing = Boolean(annonceId)
  const [hydratedId, setHydratedId] = useState<string | null>(null)
  const [contenu, setContenu] = useState('')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [titre, setTitre] = useState('')
  const userId = useCurrentUserId()
  const { data: profile, isPending: isLoadingProfile, isSessionLoading, isError: isProfileError } = useCurrentProfile()
  const canManage = !isProfileError && profile?.statutAcces === 'accepte' && canManagePredications(profile.roleApp)
  const isCheckingAccess = isSessionLoading || Boolean(userId && isLoadingProfile)
  const queryClient = useQueryClient()
  const annonceQuery = useQuery({
    queryKey: [...annoncesQueryKey(userId), 'detail', annonceId],
    queryFn: () => annonceService.getAnnonce(annonceId!),
    enabled: Boolean(annonceId && userId && canManage),
  })

  if (annonceId && annonceQuery.data && !annonceQuery.isFetching && hydratedId !== annonceId) {
    setTitre(annonceQuery.data.titre)
    setContenu(annonceQuery.data.contenu)
    setHydratedId(annonceId)
  }

  const saveMutation = useMutation({
    mutationFn: (data: Omit<CreateAnnonceModel, 'createdBy'>) =>
      annonceId ? annonceService.updateAnnonce(annonceId, data) : annonceService.createAnnonce(data),
    onMutate: () => ({ userId }),
    onSuccess: (annonce, _data, context) => {
      if (!context?.userId || context.userId !== userId) return
      if (annonceId) {
        queryClient.setQueryData([...annoncesQueryKey(userId), 'detail', annonceId], annonce)
      }
      return applyAnnonceChange(queryClient, userId, { type: 'upsert', annonce })
    },
  })
  const isSubmitting = saveMutation.isPending
  const canEdit = canManage && (!isEditing || (hydratedId === annonceId && Boolean(annonceQuery.data) && !annonceQuery.isError))

  async function saveAnnonce() {
    if (isSubmitting || !canEdit) return
    const trimmedTitre = titre.trim()
    const trimmedContenu = contenu.trim()

    setErrorText(null)

    if (!trimmedTitre) {
      setErrorText('Le titre est obligatoire.')
      return
    }

    if (!trimmedContenu) {
      setErrorText('Le contenu est obligatoire.')
      return
    }

    try {
      await saveMutation.mutateAsync({
        titre: trimmedTitre,
        contenu: trimmedContenu,
      })

      Alert.alert(isEditing ? 'Annonce modifiée' : 'Annonce créée',
        isEditing ? 'Les changements sont enregistrés.' : "L'annonce est maintenant disponible.")
      router.back()
    } catch (error) {
      setErrorText(toErrorMessage(error, isEditing ? "Impossible de modifier l'annonce." : "Impossible de créer l'annonce."))
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
          <Text style={styles.backLabel}>Accueil</Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.title}>{isEditing ? 'Modifier une annonce' : 'Créer une annonce'}</Text>
      </View>

      {isCheckingAccess ? <Text>Vérification des droits...</Text> : !canManage ? (
        <Text style={styles.errorText}>Seuls les pasteurs et administrateurs peuvent gérer les annonces.</Text>
      ) : isEditing && (annonceQuery.isPending || (!hydratedId && annonceQuery.isFetching)) ? <Text>Chargement de l&apos;annonce...</Text> : null}
      {canManage && isEditing && annonceQuery.isError ? (
        <View>
          <Text style={styles.errorText}>{toErrorMessage(annonceQuery.error, "Impossible de charger l'annonce.")}</Text>
          <Pressable accessibilityRole="button" onPress={() => void annonceQuery.refetch()}>
            <Text style={styles.label}>Réessayer</Text>
          </Pressable>
        </View>
      ) : null}
      {canManage && isEditing && annonceQuery.isSuccess && !annonceQuery.data ? (
        <Text style={styles.errorText}>Cette annonce n&apos;est plus disponible.</Text>
      ) : null}

      {canEdit ? (
        <View style={styles.formCard}>
          <Text style={styles.label}>Titre</Text>
          <TextInput
            onChangeText={setTitre}
            placeholder="Titre de l'annonce"
            placeholderTextColor={colors.outline}
            style={styles.input}
            value={titre}
          />

          <Text style={styles.label}>Contenu</Text>
          <TextInput
            multiline
            numberOfLines={6}
            onChangeText={setContenu}
            placeholder="Écris ton annonce"
            placeholderTextColor={colors.outline}
            style={[styles.input, styles.multiline]}
            textAlignVertical="top"
            value={contenu}
          />

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || !userId}
            onPress={saveAnnonce}
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Enregistrement...' : isEditing ? 'Enregistrer les modifications' : "Créer l'annonce"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 36,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 34,
    lineHeight: 36,
  },
  backLabel: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  label: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
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
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 140,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
})
