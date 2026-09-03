import { StyleSheet, Text, View } from 'react-native'

export default function PredicationScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prédication</Text>
      <Text style={styles.emptyText}>Aucune prédication pour le moment.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    flex: 1,
    gap: 12,
    padding: 24,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '700',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
})
