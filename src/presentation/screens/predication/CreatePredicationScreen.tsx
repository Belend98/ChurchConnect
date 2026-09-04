import { predicationService } from '@/composition/predication'
import {
  createPredicationSchema,
  type CreatePredicationInput,
} from '@/domain/rules/predicationSchema'
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

export default function CreatePredicationScreen() {
  const [errorText, setErrorText] = useState<string | null>(null)
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

  async function onSubmit(data: CreatePredicationInput) {
    setErrorText(null)

    try {
      const durationSeconds = data.durationMinutes
        ? Math.round(Number(data.durationMinutes) * 60)
        : undefined

      await predicationService.createPredication({
        categorieId: data.categorieId?.trim() || undefined,
        durationSeconds,
        mediaUrl: data.mediaUrl.trim(),
        title: data.title.trim(),
      })

      Alert.alert('Prédication créée', 'Elle est maintenant enregistrée.')
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
        <Text style={styles.eyebrow}>Nouvelle ressource</Text>
        <Text style={styles.title}>Créer une prédication</Text>
        <Text style={styles.intro}>
          Renseigne les données de base attendues par le modèle de prédication.
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
              placeholder="Ex. Marcher avec confiance"
              placeholderTextColor={colors.outline}
              style={styles.input}
              value={value}
            />
          )}
        />
        {errors.title ? (
          <Text style={styles.errorText}>{errors.title.message}</Text>
        ) : null}

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

        <Text style={styles.label}>Catégorie ou série</Text>
        <Controller
          control={control}
          name="categorieId"
          render={({ field: { onBlur, onChange, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Ex. Foi Vraie"
              placeholderTextColor={colors.outline}
              style={styles.input}
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
