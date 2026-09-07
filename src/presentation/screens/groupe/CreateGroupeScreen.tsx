import { groupeService } from '@/composition/groupe'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { router } from 'expo-router'
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

export default function CreateGroupeScreen() {
  const [description, setDescription] = useState('')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')

  async function createGroupe() {
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    setErrorText(null)

    if (!trimmedName) {
      setErrorText('Le nom du groupe est obligatoire.')
      return
    }

    setIsSubmitting(true)

    try {
      await groupeService.createGroupe({
        description: trimmedDescription || undefined,
        name: trimmedName,
      })

      Alert.alert('Groupe créé', 'Le groupe est maintenant disponible.')
      router.back()
    } catch (error) {
      setErrorText(toErrorMessage(error, 'Impossible de créer le groupe.'))
    } finally {
      setIsSubmitting(false)
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
          <Text style={styles.backLabel}>Groupes</Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.eyebrow}>Nouvel espace</Text>
        <Text style={styles.title}>Créer un groupe</Text>
        <Text style={styles.intro}>
          Créez un groupe privé. Vous en serez automatiquement membre et admin.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Nom du groupe</Text>
        <TextInput
          onChangeText={setName}
          placeholder="Ex: Jeunesse, Chorale, Intercession"
          placeholderTextColor={colors.outline}
          style={styles.input}
          value={name}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          multiline
          numberOfLines={4}
          onChangeText={setDescription}
          placeholder="Quelques mots sur le but du groupe"
          placeholderTextColor={colors.outline}
          style={[styles.input, styles.multiline]}
          textAlignVertical="top"
          value={description}
        />

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <Pressable
          disabled={isSubmitting}
          onPress={createGroupe}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Création...' : 'Créer le groupe'}
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
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 110,
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
