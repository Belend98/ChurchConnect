import type { GroupeModel } from '@/domain/entities/Groupe'
import { ListCount } from '@/presentation/component/ListCount'
import { useGroupes } from '@/presentation/hooks/groupe/useGroupes'
import { colors } from '@/shared/theme/colors'
import { toErrorMessage } from '@/shared/utils/errors'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

function normalizeGroupSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export default function GroupeScreen() {
  const { data: groups = [], isPending, isError, error, refetch } = useGroupes()
  const [search, setSearch] = useState('')
  const normalizedSearch = normalizeGroupSearch(search.trim())
  const visibleGroups = groups.filter((group) => normalizeGroupSearch(group.name).includes(normalizedSearch))

  function openCreateGroupe() {
    router.push('/create-groupe')
  }

  function openGroupe(group: GroupeModel) {
    router.push(
      {
        pathname: '/groupe-detail',
        params: {
          id: group.id,
          name: group.name,
        },
      },
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Mes groupes</Text>
            {!isPending && !isError ? <ListCount count={visibleGroups.length} label="groupes affichés" /> : null}
          </View>
          <Pressable onPress={openCreateGroupe} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Créer</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            accessibilityLabel="Rechercher un groupe par nom"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Nom du groupe"
            placeholderTextColor={colors.onSurfaceVariant}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />
          {search ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Effacer la recherche" onPress={() => setSearch('')} style={styles.clearSearch}>
              <Text style={styles.clearSearchText}>×</Text>
            </Pressable>
          ) : null}
        </View>

        {visibleGroups.length > 0 ? (
          <View style={styles.groupList}>
          {visibleGroups.map((group) => (
            <Pressable
              key={group.id}
              onPress={() => openGroupe(group)}
              style={styles.groupRow}
            >
              <View style={styles.groupAvatar}>
                <Text style={styles.groupInitial}>
                  {group.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.groupBody}>
                <View style={styles.groupTopLine}>
                  <Text numberOfLines={1} style={styles.groupName}>
                    {group.name}
                  </Text>
                  <Text style={styles.groupTime}>
                    {group.createdAt.toLocaleDateString('fr-FR')}
                  </Text>
                </View>

                {group.description?.trim() ? (
                  <Text numberOfLines={1} style={styles.lastMessage}>
                    {group.description}
                  </Text>
                ) : null}

              </View>
              <Text style={styles.groupArrow}>›</Text>
            </Pressable>
          ))}
          </View>
        ) : null}

        {isPending ? <ActivityIndicator color={colors.primary} /> : null}

        {isError ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {toErrorMessage(error, 'Impossible de charger les groupes.')}
            </Text>
            <Pressable onPress={() => void refetch()}>
              <Text style={styles.groupMeta}>Réessayer</Text>
            </Pressable>
          </View>
        ) : null}

        {!isPending && !isError && groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun groupe</Text>
            <Text style={styles.emptyText}>
              Créez un groupe ou demandez une invitation pour rejoindre une
              discussion.
            </Text>
          </View>
        ) : null}

        {!isPending && !isError && groups.length > 0 && visibleGroups.length === 0 ? (
          <Text style={styles.emptyText}>Aucun groupe ne correspond à votre recherche.</Text>
        ) : null}

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    gap: 16,
    maxWidth: 520,
    padding: 20,
    paddingBottom: 96,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    flexShrink: 1,
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  headerButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  groupList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 10,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    flexDirection: 'row',
    minHeight: 44,
  },
  searchInput: {
    color: colors.onSurface,
    flex: 1,
    fontSize: 14,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clearSearch: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    width: 44,
  },
  clearSearchText: {
    color: colors.onSurfaceVariant,
    fontSize: 24,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  groupRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  groupAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  groupInitial: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  groupBody: {
    flex: 1,
    gap: 4,
  },
  groupTopLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  groupName: {
    color: colors.primary,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  groupTime: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  lastMessage: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  groupMeta: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
  },
  groupArrow: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
})
