import { annonceService } from '@/composition/annonce'
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

export default function CreateAnnonceScreen() {
  const [contenu, setContenu] = useState('')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [titre, setTitre] = useState('')

  async function createAnnonce() {
    const trimmedTitre = titre.trim()
    const trimmedContenu = contenu.trim()
    const trimmedImageUrl = imageUrl.trim()

    setErrorText(null)

    if (!trimmedTitre) {
      setErrorText('Le titre est obligatoire.')
      return
    }

    if (!trimmedContenu) {
      setErrorText('Le contenu est obligatoire.')
      return
    }

    setIsSubmitting(true)

    try {
      await annonceService.createAnnonce({
        titre: trimmedTitre,
        contenu: trimmedContenu,
        imageUrl: trimmedImageUrl || undefined,
      })

      Alert.alert('Annonce créée', "L'annonce est maintenant disponible.")
      router.back()
    } catch (error) {
      setErrorText(toErrorMessage(error, "Impossible de créer l'annonce."))
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
          <Text style={styles.backLabel}>Accueil</Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.title}>Créer une annonce</Text>
      </View>

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

        <Text style={styles.label}>Image URL</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={setImageUrl}
          placeholder="https://..."
          placeholderTextColor={colors.outline}
          style={styles.input}
          value={imageUrl}
        />

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <Pressable
          disabled={isSubmitting}
          onPress={createAnnonce}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Création...' : "Créer l'annonce"}
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
