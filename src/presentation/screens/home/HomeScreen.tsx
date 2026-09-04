import { colors } from '@/shared/theme/colors'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

const shortcuts = [
  { label: 'Mes groupes', color: colors.primary, backgroundColor: '#d5e3ff' },
  { label: 'Cultes', color: colors.secondary, backgroundColor: '#ffdbcf' },
  { label: 'Prière', color: '#002234', backgroundColor: colors.tertiaryFixed },
]

const announcements = [
  {
    title: 'Fête paroissiale',
    date: 'Dimanche 15 mai',
    description: 'Repas partagé, temps fraternel et barbecue après le culte.',
    tag: 'Important',
  },
  {
    title: 'Camp des jeunes',
    date: '7 au 14 juillet',
    description: 'Les inscriptions sont ouvertes pour les 12-17 ans.',
    tag: 'Cette semaine',
  },
]

export default function HomeScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Communauté réunie</Text>
          <Text style={styles.title}>Bonjour Claire,</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>C</Text>
        </View>
      </View>

      <Text style={styles.intro}>
        Bienvenue dans votre espace de fraternité, de prédication et de prière.
      </Text>

      <View style={styles.verseCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Méditation du jour</Text>
          <Text style={styles.sectionMeta}>Mt 18:20</Text>
        </View>
        <Text style={styles.verseText}>
          {
            "« Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux. »"
          }
        </Text>
      </View>

      <View style={styles.shortcutGrid}>
        {shortcuts.map((shortcut) => (
          <Pressable key={shortcut.label} style={styles.shortcut}>
            <View
              style={[
                styles.shortcutIcon,
                { backgroundColor: shortcut.backgroundColor },
              ]}
            >
              <Text style={[styles.shortcutInitial, { color: shortcut.color }]}>
                {shortcut.label.charAt(0)}
              </Text>
            </View>
            <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sermonCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dernière prédication</Text>
          <Text style={styles.sectionMeta}>28 min</Text>
        </View>
        <Text style={styles.sermonTitle}>
          La paix qui surpasse toute intelligence
        </Text>
        <Text style={styles.sermonSubtitle}>
          Pasteur Jean-Marc et Sarah · Série : Cœurs affermis
        </Text>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Écouter</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vie de la communauté</Text>
        <Text style={styles.badge}>2</Text>
      </View>

      <View style={styles.announcementList}>
        {announcements.map((item) => (
          <View key={item.title} style={styles.announcementCard}>
            <View style={styles.announcementTopLine}>
              <Text style={styles.announcementDate}>{item.date}</Text>
              <Text style={styles.tag}>{item.tag}</Text>
            </View>
            <Text style={styles.announcementTitle}>{item.title}</Text>
            <Text style={styles.announcementDescription}>{item.description}</Text>
          </View>
        ))}
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  intro: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  verseCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    gap: 14,
    padding: 18,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '700',
  },
  verseText: {
    color: colors.primary,
    fontSize: 19,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 29,
  },
  shortcutGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcut: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 94,
    padding: 12,
  },
  shortcutIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  shortcutInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  shortcutLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  sermonCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 10,
    padding: 18,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: '800',
  },
  sermonTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
  },
  sermonSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: colors.secondary,
    borderRadius: 13,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  announcementList: {
    gap: 10,
  },
  announcementCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 6,
    padding: 16,
  },
  announcementTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  announcementDate: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  tag: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 999,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  announcementTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  announcementDescription: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  prayerCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
  },
  prayerAccent: {
    alignSelf: 'stretch',
    backgroundColor: colors.secondary,
    borderRadius: 999,
    width: 4,
  },
  prayerContent: {
    flex: 1,
    gap: 8,
  },
  prayerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  prayerText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  secondaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryContainer,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 2,
    minHeight: 44,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#390c00',
    fontSize: 14,
    fontWeight: '800',
  },
})
