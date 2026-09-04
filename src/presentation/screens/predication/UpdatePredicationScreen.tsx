import { predicationService } from '@/composition/predication'
import {
  createPredicationSchema,
  type CreatePredicationInput,
} from '@/domain/rules/predicationSchema'
import { PredicationCategoryPicker } from '@/presentation/component/PredicationCategoryPicker'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { zodResolver } from '@hookform/resolvers/zod'
import * as DocumentPicker from 'expo-document-picker'
import { router, useLocalSearchParams } from 'expo-router'
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

type SelectedAudioFile = {
  contentType: string
  fileName: string
  size?: number
  uri: string
}

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

function secondsToMinutes(value: string): string {
  const seconds = Number(value)

  if (!Number.isFinite(seconds) || seconds <= 0) return ''

  return String(Math.round(seconds / 60))
}

export default function UpdatePredicationScreen() {
  const params = useLocalSearchParams()
  const predicationId = getParam(params.id)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [selectedAudio, setSelectedAudio] = useState<SelectedAudioFile | null>(
    null,
  )
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreatePredicationInput>({
    resolver: zodResolver(createPredicationSchema),
    defaultValues: {
      categorieId: getParam(params.categorieId),
      durationMinutes: secondsToMinutes(getParam(params.durationSeconds)),
      mediaUrl: getParam(params.mediaUrl),
      title: getParam(params.title),
    },
  })

  async function pickAudioFile() {
    setErrorText(null)

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: 'audio/*',
      })

      if (result.canceled) return

      const file = result.assets[0]

      setSelectedAudio({
        contentType: file.mimeType ?? 'audio/mpeg',
        fileName: file.name,
        size: file.size,
        uri: file.uri,
      })
    } catch (error) {
      setErrorText(toErrorMessage(error))
    }
  }

  async function onSubmit(data: CreatePredicationInput) {
    setErrorText(null)

    try {
      if (!predicationId) {
        setErrorText("Identifiant de prédication manquant.")
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

        await predicationService.updatePredicationWithAudio(predicationId, {
          audio,
          categorieId: data.categorieId?.trim() || undefined,
          contentType: selectedAudio.contentType,
          durationSeconds,
          fileName: selectedAudio.fileName,
          title: data.title.trim(),
        })
      } else {
        await predicationService.updatePredication(predicationId, {
          categorieId: data.categorieId?.trim() || undefined,
          durationSeconds,
          mediaUrl: data.mediaUrl?.trim() ?? '',
          title: data.title.trim(),
        })
      }

      Alert.alert('Prédication modifiée', 'Les changements sont enregistrés.')
      router.back()
    } catch (error) {
      setErrorText(toErrorMessage(error))
    }
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
        <Text style={styles.eyebrow}>Ressource existante</Text>
        <Text style={styles.title}>Modifier la prédication</Text>
        <Text style={styles.intro}>
          Mets à jour les données enregistrées pour cette prédication.
        </Text>
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
              {selectedAudio ? selectedAudio.fileName : 'Audio actuel conservé'}
            </Text>
            <Text style={styles.fileMeta}>
              {selectedAudio
                ? `${selectedAudio.contentType}${
                    selectedAudio.size
                      ? ` · ${Math.round(selectedAudio.size / 1024 / 1024)} Mo`
                      : ''
                  }`
                : 'Choisis un fichier seulement pour remplacer l’audio'}
            </Text>
          </View>
          <Pressable onPress={pickAudioFile} style={styles.fileButton}>
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

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <Pressable
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Modification...' : 'Modifier la prédication'}
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
  eyebrow: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 4,
  },
  intro: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 8,
    padding: 18,
  },
  label: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
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
  fileBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 12,
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
    fontWeight: '800',
  },
  fileMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  fileButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  fileButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
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
    borderRadius: 12,
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
    fontWeight: '900',
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
})
