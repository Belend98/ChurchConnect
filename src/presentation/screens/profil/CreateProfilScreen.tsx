import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { authService } from '@/composition/Auth'
import { colors } from '@/shared/theme/colors'
import {
  createUserSchema,
  type CreateUserFormInput,
  type CreateUserInput,
} from '@/domain/rules/userSchema'
import { profilService } from '@/composition/profil'
import { useImageFilePicker } from '@/presentation/hooks/useImageFilePicker'

type SupabaseLikeError = {
  code?: string
  message?: string
  details?: string
}

function toReadableProfileError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as SupabaseLikeError

    if (err.code === '23505') {
      return "Ce nom d'utilisateur est deja utilise. Choisis-en un autre."
    }

    if (err.message) {
      return err.details ? `${err.message} (${err.details})` : err.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Impossible de creer le profil.'
}

const ProfileSetupScreen = () => {
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormInput, unknown, CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      nom: '',
      prenom: '',
      bio: '',
      dateNaissance: '',
    },
  })

  const [errorText, setErrorText] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>()
  const {
    clearImagePickerError,
    imagePickerError,
    pickImageFile,
    selectedImage,
  } = useImageFilePicker()

  useEffect(() => {
    let isMounted = true

    authService
      .getCurrentUser()
      .then(async (user) => {
        if (!user) return null
        return profilService.getMyProfile(user.id)
      })
      .then((profile) => {
        if (!isMounted || !profile) return

        setValue('username', profile.username ?? '')
        setValue('nom', profile.nom ?? '')
        setValue('prenom', profile.prenom ?? '')
        setValue('bio', profile.bio ?? '')
        setValue(
          'dateNaissance',
          profile.dateNaissance?.toISOString().slice(0, 10) ?? '',
        )
        setExistingImageUrl(profile.imageUrl)
      })
      .catch((error) => console.warn(error))

    return () => {
      isMounted = false
    }
  }, [setValue])

  const handleSignOut = async () => {
    try {
      await authService.signOut()
      router.replace('/(auth)/signup')
    } catch {
      Alert.alert('Erreur', 'Impossible de se deconnecter')
    }
  }

  const onSubmit = async (data: CreateUserInput) => {
    setErrorText(null)
    clearImagePickerError()

    const user = await authService.getCurrentUser()

    if (!user) {
      setErrorText('Session invalide. Reconnecte-toi.')
      router.replace('/(auth)/signup')
      return
    }

    try {
      if (selectedImage) {
        const response = await fetch(selectedImage.uri)
        const image = await response.arrayBuffer()

        await profilService.createProfileWithImage(user.id, {
          ...data,
          imageFile: {
            contentType: selectedImage.contentType,
            fileName: selectedImage.fileName,
            image,
          },
        })
      } else {
        await profilService.createProfile(user.id, {
          ...data,
          imageUrl: existingImageUrl,
        })
      }

      Alert.alert('Profil enregistré', 'Ton profil est pret.')
      router.replace('../(tabs)/home')
    } catch (error) {
      setErrorText(toReadableProfileError(error))
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Complète ton profil</Text>
      <Text style={styles.subtitle}>Ajoute quelques infos avant de continuer.</Text>

      <Text style={styles.label}>Photo de profil</Text>
      <View style={styles.imagePickerBox}>
        {selectedImage?.uri || existingImageUrl ? (
          <Image
            source={{ uri: selectedImage?.uri ?? existingImageUrl }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImagePlaceholderText}>Photo</Text>
          </View>
        )}
        <View style={styles.imagePickerInfo}>
          <Text style={styles.imagePickerTitle}>
            {selectedImage ? selectedImage.fileName : 'Aucune image choisie'}
          </Text>
          <Text style={styles.imagePickerMeta}>
            {selectedImage
              ? `${selectedImage.contentType}${
                  selectedImage.size
                    ? ` · ${Math.round(selectedImage.size / 1024)} Ko`
                    : ''
                }`
              : 'JPG, PNG ou autre image'}
          </Text>
        </View>
        <Pressable onPress={pickImageFile} style={styles.imagePickerButton}>
          <Text style={styles.imagePickerButtonText}>Choisir</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Nom d&apos;utilisateur</Text>
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Entrez un nom"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}

      <Text style={styles.label}>Nom</Text>
      <Controller
        control={control}
        name="nom"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Entrez ton nom"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.nom && <Text style={styles.errorText}>{errors.nom.message}</Text>}

      <Text style={styles.label}>Prénom</Text>
      <Controller
        control={control}
        name="prenom"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Entrez ton prénom"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.prenom && <Text style={styles.errorText}>{errors.prenom.message}</Text>}

      <Text style={styles.label}>Bio</Text>
      <Controller
        control={control}
        name="bio"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Courte biographie"
            multiline
            numberOfLines={3}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.bio && <Text style={styles.errorText}>{errors.bio.message}</Text>}

      <Text style={styles.label}>Date de naissance</Text>
      <Controller
        control={control}
        name="dateNaissance"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-JJ"
            keyboardType="numbers-and-punctuation"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
          />
        )}
      />
      {errors.dateNaissance && (
        <Text style={styles.errorText}>{errors.dateNaissance.message}</Text>
      )}

      {errorText || imagePickerError ? (
        <Text style={styles.errorText}>{errorText ?? imagePickerError}</Text>
      ) : null}

      <Pressable
        onPress={handleSubmit(onSubmit)}
        style={[styles.button, isSubmitting ? styles.buttonDisabled : undefined]}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer mon profil'}
        </Text>
      </Pressable>

      <Pressable onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutButtonText}>Se deconnecter</Text>
      </Pressable>
    </ScrollView>
  )
}

export default ProfileSetupScreen

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: colors.onSurfaceVariant,
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    color: colors.onSurface,
    padding: 10,
    backgroundColor: colors.surfaceContainerLowest,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePickerBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  profileImage: {
    borderRadius: 26,
    height: 52,
    width: 52,
  },
  profileImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  profileImagePlaceholderText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
  },
  imagePickerInfo: {
    flex: 1,
    gap: 4,
  },
  imagePickerTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  imagePickerMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  imagePickerButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  imagePickerButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    marginTop: 16,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 12,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.error,
    borderWidth: 1,
  },
  signOutButtonText: {
    color: colors.error,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    marginTop: 6,
  },
})
