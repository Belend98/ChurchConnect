import { DateTimePicker } from '@expo/ui/community/datetime-picker'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import type { BirthDateFieldProps } from './BirthDateField.types'
import { colors } from '@/shared/theme/colors'
import { formatDateOnly, isValidDateOnly } from '@/shared/utils/dateOnly'

export function BirthDateField({ value, onChange, onBlur, disabled }: BirthDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(new Date())
  const isAndroid = Platform.OS === 'android'
  const today = formatDateOnly(new Date())
  const displayValue = value && isValidDateOnly(value)
    ? new Date(`${value}T12:00:00`).toLocaleDateString('fr-BE')
    : 'Choisir une date'

  function openCalendar() {
    const initialValue = value && isValidDateOnly(value) && value <= today ? value : today
    setDraft(new Date(`${initialValue}T12:00:00${isAndroid ? 'Z' : ''}`))
    setIsOpen(true)
  }

  function closeCalendar() {
    setIsOpen(false)
    onBlur()
  }

  function saveDate(date: Date) {
    onChange(formatDateOnly(date, isAndroid))
    closeCalendar()
  }

  const picker = (
    <DateTimePicker
      value={draft}
      mode="date"
      display={isAndroid ? 'default' : 'inline'}
      maximumDate={new Date(`${today}T23:59:59${isAndroid ? 'Z' : ''}`)}
      locale="fr_FR"
      themeVariant="light"
      accentColor={colors.primary}
      positiveButton={{ label: 'Choisir' }}
      negativeButton={{ label: 'Annuler' }}
      onDismiss={closeCalendar}
      onValueChange={(_, date) => {
        if (isAndroid) saveDate(date)
        else setDraft(date)
      }}
    />
  )

  return (
    <>
      <View style={styles.fieldRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Date de naissance : ${displayValue}`}
          accessibilityState={{ disabled, expanded: isOpen }}
          disabled={disabled}
          onPress={openCalendar}
          style={[styles.field, disabled && styles.disabled]}
        >
          <Text style={[styles.value, !value && styles.placeholder]}>{displayValue}</Text>
          <SymbolView name={{ ios: 'calendar', android: 'calendar_month'}} size={20} tintColor={colors.primary} />
        </Pressable>
        {value ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Effacer la date de naissance" disabled={disabled} onPress={() => {
            onChange('')
            onBlur()
          }} style={styles.clearButton}>
            <Text style={styles.clearText}>Effacer</Text>
          </Pressable>
        ) : null}
      </View>
      {isAndroid ? (isOpen ? picker : null) : (
        <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeCalendar}>
          <View style={styles.overlay}>
            <View accessibilityViewIsModal style={styles.dialog}>
              <Text accessibilityRole="header" style={styles.title}>Date de naissance</Text>
              {isOpen ? picker : null}
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={closeCalendar} style={styles.cancelButton}>
                  <Text style={styles.clearText}>Annuler</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => saveDate(draft)} style={styles.confirmButton}>
                  <Text style={styles.confirmText}>Choisir cette date</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 44, borderWidth: 1, borderColor: colors.surfaceContainerHigh, borderRadius: 8, padding: 10, backgroundColor: colors.surfaceContainerLowest },
  value: { color: colors.onSurface, fontSize: 14 },
  placeholder: { color: colors.onSurfaceVariant },
  disabled: { opacity: 0.6 },
  clearButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  clearText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: 'rgba(3, 31, 65, 0.42)' },
  dialog: { width: '100%', maxWidth: 400, borderRadius: 12, padding: 16, gap: 12, backgroundColor: colors.surfaceContainerLowest },
  title: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  cancelButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.surfaceContainer },
  confirmButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.primary },
  confirmText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
})
