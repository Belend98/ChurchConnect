import { predicationService } from '@/composition/predication'
import {
  createPredicationSchema,
  type CreatePredicationInput,
} from '@/domain/rules/predicationSchema'
import { PredicationCategoryPicker } from '@/presentation/component/PredicationCategoryPicker'
import { useAudioFilePicker } from '@/presentation/hooks/predication/useAudioFilePicker'
import { useRequirePredicationManager } from '@/presentation/hooks/predication/useRequirePredicationManager'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

const ACCESS_DENIED_MESSAGE =
  'Seuls les pasteurs et administrateurs peuvent créer une prédication.'

export default function CreatePredicationScreen() {
  const [errorText, setErrorText] = useState<string | null>(null)
  const {
    audioPickerError,
    clearAudioPickerError,
    pickAudioFile,
    selectedAudio,
  } = useAudioFilePicker()
  const { canAccessScreen, isCheckingAccess } = useRequirePredicationManager({
    deniedMessage: ACCESS_DENIED_MESSAGE,
  })
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePredicationInput>({
    resolver: zodResolver(createPredicationSchema),
    defaultValues: {
      categorieId: '',
      durationMinutes: '',
      mediaUrl: '',
      title: '',
    },
  })

  async function handlePickAudioFile() {
    if (!canAccessScreen) return

    setErrorText(null)
    await pickAudioFile()
  }

  async function onSubmit(data: CreatePredicationInput) {
    setErrorText(null)
    clearAudioPickerError()

    try {
      if (!canAccessScreen) {
        setErrorText(ACCESS_DENIED_MESSAGE)
        return
      }

      if (!selectedAudio && !data.mediaUrl?.trim()) {
        setErrorText('Choisis un fichier audio ou entre une URL audio.')
        return
      }

      const durationSeconds = data.durationMinutes
        ? Math.round(Number(data.durationMinutes) * 60)
        : undefined

      if (selectedAudio) {
        const response = await fetch(selectedAudio.uri)
        const audio = await response.arrayBuffer()

        await predicationService.createPredicationWithAudio({
          audio,
          categorieId: data.categorieId?.trim() || undefined,
          contentType: selectedAudio.contentType,
          durationSeconds,
          fileName: selectedAudio.fileName,
          title: data.title.trim(),
        })
      } else {
        await predicationService.createPredication({
          categorieId: data.categorieId?.trim() || undefined,
          durationSeconds,
          mediaUrl: data.mediaUrl?.trim() ?? '',
          title: data.title.trim(),
        })
      }

      Alert.alert('Prédication créée', 'Elle est maintenant enregistrée.')
      router.back()
    } catch (error) {
      setErrorText(toErrorMessage(error))
    }
  }

  if (isCheckingAccess || !canAccessScreen) {
    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
            <Text style={styles.backLabel}>Prédications</Text>
          </Pressable>
        </View>

        <View style={styles.accessCard}>
          <Text style={styles.accessTitle}>
            {isCheckingAccess ? 'Vérification des droits' : 'Accès refusé'}
          </Text>
          <Text style={styles.accessText}>
            {isCheckingAccess
              ? 'Un instant, nous vérifions ton statut.'
              : ACCESS_DENIED_MESSAGE}
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
          <Text style={styles.backLabel}>Prédications</Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.title}>Créer une prédication</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Titre</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Titre de la prédication"
              placeholderTextColor={colors.outline}
              style={styles.input}
              value={value}
            />
          )}
        />
        {errors.title ? (
          <Text style={styles.errorText}>{errors.title.message}</Text>
        ) : null}

        <Text style={styles.label}>Fichier audio</Text>
        <View style={styles.fileBox}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileTitle}>
              {selectedAudio ? selectedAudio.fileName : 'Aucun fichier choisi'}
            </Text>
            <Text style={styles.fileMeta}>
              {selectedAudio
                ? `${selectedAudio.contentType}${
                    selectedAudio.size
                      ? ` · ${Math.round(selectedAudio.size / 1024 / 1024)} Mo`
                      : ''
                  }`
                : 'MP3, M4A, WAV ou autre fichier audio'}
            </Text>
          </View>
          <Pressable onPress={handlePickAudioFile} style={styles.fileButton}>
            <Text style={styles.fileButtonText}>Choisir</Text>
          </Pressable>
        </View>

        <Text style={styles.orText}>ou</Text>

        <Text style={styles.label}>URL audio</Text>
        <Controller
          control={control}
          name="mediaUrl"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="https://..."
              placeholderTextColor={colors.outline}
              style={styles.input}
              value={value}
            />
          )}
        />
        {errors.mediaUrl ? (
          <Text style={styles.errorText}>{errors.mediaUrl.message}</Text>
        ) : null}

        <Text style={styles.label}>Durée en minutes</Text>
        <Controller
          control={control}
          name="durationMinutes"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="32"
              placeholderTextColor={colors.outline}
              style={styles.input}
              value={value}
            />
          )}
        />
        {errors.durationMinutes ? (
          <Text style={styles.errorText}>{errors.durationMinutes.message}</Text>
        ) : null}

        <Text style={styles.label}>Catégorie</Text>
        <Controller
          control={control}
          name="categorieId"
          render={({ field: { onChange, value } }) => (
            <PredicationCategoryPicker
              error={errors.categorieId?.message}
              onChange={onChange}
              value={value}
            />
          )}
        />

        {errorText || audioPickerError ? (
          <Text style={styles.errorText}>{errorText ?? audioPickerError}</Text>
        ) : null}

        <Pressable
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Création...' : 'Créer la prédication'}
          </Text>
        </Pressable>
      </View>
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
  },
  fileBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 14,
  },
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  fileTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  fileMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
  },
  fileButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  fileButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  orText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
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
  accessCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  accessTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900',
  },
  accessText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
})
