import { colors } from '@/shared/theme/colors'
import { StyleSheet, TextInput } from 'react-native'
import type { BirthDateFieldProps } from './BirthDateField.types'

export function BirthDateField({ value, onChange, onBlur, disabled }: BirthDateFieldProps) {
  return (
    <TextInput
      accessibilityLabel="Date de naissance"
      style={styles.input}
      placeholder="AAAA-MM-JJ"
      keyboardType="numbers-and-punctuation"
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      editable={!disabled}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    color: colors.onSurface,
    padding: 10,
    backgroundColor: colors.surfaceContainerLowest,
  },
})
