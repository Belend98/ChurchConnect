import { authService } from '@/composition/Auth'
import { signUpSchema, type SignUpInput } from '@/domain/rules/authSchema'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

const SignUpScreen = () => {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      rgpdConsent: false,
    },
  })
  const [errorText, setErrorText] = useState<string | null>(null)

  const onSubmit = async (data: SignUpInput) => {
    setErrorText(null)
    try {
      const result = await authService.signUp(data.email, data.password)
      if (result.hasSession) {
        Alert.alert('Compte crée', 'Inscription réussie.')
        router.replace('/(auth)/profil')
        return
      }
      Alert.alert(
        'Vérifie ton email',
        'Ton compte est crée. Vérifie ta boite mail pour confirmer ton adresse.',
      )
      
    } catch (error) {
      setErrorText(toErrorMessage(error))
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <Text style={styles.title}>Créer un compte</Text>
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
            placeholder="Au moins 8 caracteres"
            style={styles.input}
          />
        )}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      <Text style={styles.label}>Confirmer le mot de passe</Text>
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Retape ton mot de passe"
            style={styles.input}
          />
        )}
      />
      {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}

      <Controller
        control={control}
        name="rgpdConsent"
        render={({ field: { onChange, value } }) => (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: value }}
            onPress={() => onChange(!value)}
            style={styles.consentRow}
          >
            <View style={[styles.checkbox, value ? styles.checkboxChecked : undefined]}>
              {value ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.consentText}>
              J&apos;accepte que les données personnelles concernées par cette demande
              soient traitées par Church Connect pour la finalité qui m&apos;a été
              présentée. Je reconnais avoir pu consulter la politique de
              confidentialité et avoir été informé de mes droits.
            </Text>
          </Pressable>
        )}
      />
      {errors.rgpdConsent && <Text style={styles.errorText}>{errors.rgpdConsent.message}</Text>}

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <Pressable
        onPress={handleSubmit(onSubmit)}
        style={[styles.button, isSubmitting ? styles.buttonDisabled : undefined]}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>{isSubmitting ? 'Inscription...' : "S'inscrire"}</Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/(auth)/signin')} style={styles.linkButton}>
        <Text style={styles.linkText}>Déja un compte ? Se connecter</Text>
      </Pressable>
    </ScrollView>
  )
}

export default SignUpScreen

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
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
    marginBottom: 6,
    fontWeight: '600',
    color: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    color: colors.onSurface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    backgroundColor: colors.surfaceContainerLowest,
  },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    marginTop: 2,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 4,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxMark: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  consentText: {
    color: colors.onSurfaceVariant,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    marginTop: 4,
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
  errorText: {
    color: colors.error,
    marginBottom: 12,
  },
  linkButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkText: {
    color: colors.secondary,
    fontWeight: '600',
  },
})
