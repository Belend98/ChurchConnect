import { colors } from '@/shared/theme/colors'
import { router, useLocalSearchParams } from 'expo-router'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default function GroupeDetailScreen() {
  const params = useLocalSearchParams()
  const groupName = getParam(params.name) || 'Groupe'

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{groupName.charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.title}>
            {groupName}
          </Text>
          <Text style={styles.subtitle}>Groupe</Text>
        </View>
      </View>

      <View style={styles.messagesArea} />

      <View style={styles.composer}>
        <TextInput
          multiline
          placeholder="Message"
          placeholderTextColor={colors.outline}
          style={styles.input}
        />
        <Pressable style={styles.sendButton}>
          <Text style={styles.sendButtonText}>➤</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomColor: colors.surfaceContainerHigh,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 14,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 32,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 34,
    lineHeight: 36,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondaryFixed,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  messagesArea: {
    flex: 1,
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceContainerLowest,
    borderTopColor: colors.surfaceContainerHigh,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  input: {
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 22,
    borderWidth: 1,
    color: colors.onSurface,
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
})
