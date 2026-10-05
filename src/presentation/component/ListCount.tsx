import { colors } from '@/shared/theme/colors'
import { StyleSheet, Text, View } from 'react-native'

type ListCountProps = {
  count: number
  label: string
}

export function ListCount({ count, label }: ListCountProps) {
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={`${count} ${label}`} style={styles.badge}>
      <Text style={styles.count}>{count.toLocaleString('fr-FR')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    justifyContent: 'center',
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  count: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
})
