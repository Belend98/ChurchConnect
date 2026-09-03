import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { authService } from '@/composition/auth'
import { createUserSchema, type CreateUserInput } from '@/domain/rules/userSchema'
import { userService } from '@/composition/user'

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
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      bio: '',
    },
  })

  const [errorText, setErrorText] = useState<string | null>(null)

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

    const user = await authService.getCurrentUser()

    if (!user) {
      setErrorText('Session invalide. Reconnecte-toi.')
      router.replace('/(auth)/signup')
      return
    }

    try {
      await userService.createProfile(user.id, data)
      Alert.alert('Profil crée', 'Ton profil est pret.')
      router.replace('../(tabs)/home')
    } catch (error) {
      setErrorText(toReadableProfileError(error))
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complète ton profil</Text>
      <Text style={styles.subtitle}>Ajoute quelques infos avant de continuer.</Text>

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
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <Pressable
        onPress={handleSubmit(onSubmit)}
        style={[styles.button, isSubmitting ? styles.buttonDisabled : undefined]}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Creation...' : 'Creer mon profil'}</Text>
      </Pressable>

      <Pressable onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutButtonText}>Se deconnecter</Text>
      </Pressable>
    </View>
  )
}

export default ProfileSetupScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: '#4B5563',
  },
  label: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 16,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  signOutButton: {
    marginTop: 12,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: '#B91C1C',
    marginTop: 6,
  },
})
