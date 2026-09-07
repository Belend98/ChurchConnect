import { authService } from '@/composition/auth'
import { signInSchema, type SignInInput } from '@/domain/rules/authSchema'
import { toErrorMessage } from '@/shared/utils/errors'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

const SignInScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })
  const [errorText, setErrorText] = useState<string | null>(null)

  const onSubmit = async (data: SignInInput) => {
    setErrorText(null)
    try {
      await authService.signIn(data.email, data.password)
      Alert.alert('Connexion réussie', 'Bienvenue.')
      router.replace('/')
    } catch (error) {
      setErrorText(toErrorMessage(error))
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Se connecter</Text>
      <Text style={styles.subtitle}>Entre ton email et ton mot de passe.</Text>

      <Text style={styles.label}>Email</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="email@exemple.com"
            style={styles.input}
          />
        )}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

      <Text style={styles.label}>Mot de passe</Text>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Ton mot de passe"
            style={styles.input}
          />
        )}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <Pressable
        onPress={handleSubmit(onSubmit)}
        style={[styles.button, isSubmitting ? styles.buttonDisabled : undefined]}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Connexion...' : 'Se connecter'}</Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/(auth)/signup' as never)} style={styles.linkButton}>
        <Text style={styles.linkText}>Pas de compte ? Créer un compte</Text>
      </Pressable>
    </View>
  )
}

export default SignInScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
    marginBottom: 6,
    fontWeight: '600',
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: 4,
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
  errorText: {
    color: '#B91C1C',
    marginBottom: 12,
  },
  linkButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkText: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
})
