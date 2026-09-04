import { groupeService } from '@/composition/groupe'
import type { GroupeModel } from '@/domain/entités/Groupe'
import { colors } from '@/shared/theme/colors'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

const filters = ['Toutes', 'Non lus', 'Mes groupes', 'Archivés']

const avatarColors = [
  colors.primary,
  colors.secondaryFixed,
  colors.primaryFixed,
  colors.tertiaryFixed,
  colors.surfaceContainerHigh,
]

export default function GroupeScreen() {
  const [groups, setGroups] = useState<GroupeModel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      let isMounted = true
      setIsLoading(true)

      groupeService
        .listGroupes()
        .then((items) => {
          if (!isMounted) return
          setGroups(items)
        })
        .catch((error) => {
          if (!isMounted) return
          console.warn(error)
          setGroups([])
        })
        .finally(() => {
          if (isMounted) setIsLoading(false)
        })

      return () => {
        isMounted = false
      }
    }, []),
  )

  function openCreateGroupe() {
    router.push('/create-groupe' as never)
  }

  function openGroupe(group: GroupeModel) {
    router.push(
      {
        pathname: '/groupe-detail',
        params: {
          id: group.id,
          name: group.name,
        },
      } as never,
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Échanges fraternels</Text>
            <Text style={styles.title}>Mes groupes</Text>
          </View>
          <Text style={styles.countBadge}>
            {isLoading ? 'Chargement' : `${groups.length} actifs`}
          </Text>
        </View>

        <Text style={styles.intro}>
          Vos conversations de groupe, visibles seulement quand vous en êtes
          membre.
        </Text>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Rechercher un groupe ou un message..."
            placeholderTextColor={colors.outline}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.createCard}>
          <View style={styles.createAccent} />
          <View style={styles.createContent}>
            <Text style={styles.createTitle}>Créer un groupe</Text>
            <Text style={styles.createText}>
              Lancez un espace de discussion puis invitez les membres concernés.
            </Text>
            <Pressable onPress={openCreateGroupe} style={styles.createButton}>
              <Text style={styles.createButtonText}>Nouveau groupe</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.filterList}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((filter, index) => (
            <Pressable
              key={filter}
              style={[
                styles.filterPill,
                index === 0 && styles.filterPillActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  index === 0 && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.groupList}>
          {groups.map((group, index) => (
            <Pressable
              key={group.id}
              onPress={() => openGroupe(group)}
              style={styles.groupRow}
            >
              <View
                style={[
                  styles.groupAvatar,
                  {
                    backgroundColor:
                      avatarColors[index % avatarColors.length],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.groupInitial,
                    {
                      color:
                        index % avatarColors.length === 0
                          ? '#ffffff'
                          : colors.primary,
                    },
                  ]}
                >
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

                <View style={styles.messageLine}>
                  <Text numberOfLines={1} style={styles.lastMessage}>
                    {group.description ?? 'Aucune description.'}
                  </Text>
                </View>

                <Text style={styles.groupMeta}>
                  {group.createdBy ? 'Groupe créé par un membre' : 'Groupe'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {!isLoading && groups.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun groupe</Text>
            <Text style={styles.emptyText}>
              Créez un groupe ou demandez une invitation pour rejoindre une
              discussion.
            </Text>
          </View>
        ) : null}

        <View style={styles.helpCard}>
          <View>
            <Text style={styles.helpTitle}>Besoin de rejoindre un échange ?</Text>
            <Text style={styles.helpText}>
              Demandez une invitation à un admin ou au secrétariat.
            </Text>
          </View>
          <Text style={styles.helpLink}>Écrire</Text>
        </View>
      </ScrollView>

      <Pressable onPress={openCreateGroupe} style={styles.floatingButton}>
        <Text style={styles.floatingButtonText}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 96,
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
  countBadge: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  intro: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    lineHeight: 24,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  searchIcon: {
    color: colors.onSurfaceVariant,
    fontSize: 24,
    fontWeight: '700',
  },
  searchInput: {
    color: colors.onSurface,
    flex: 1,
    fontSize: 15,
    minHeight: 52,
  },
  createCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    overflow: 'hidden',
    padding: 18,
  },
  createAccent: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    width: 4,
  },
  createContent: {
    flex: 1,
    gap: 8,
  },
  createTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  createText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  createButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  filterList: {
    gap: 10,
    paddingRight: 20,
  },
  filterPill: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  groupList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    gap: 8,
    padding: 18,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 21,
  },
  groupRow: {
    alignItems: 'center',
    borderBottomColor: colors.surfaceContainerHigh,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  groupAvatar: {
    alignItems: 'center',
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  groupInitial: {
    fontSize: 19,
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
    fontSize: 16,
    fontWeight: '800',
  },
  groupTime: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  groupTimeUnread: {
    color: colors.secondary,
  },
  messageLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  lastMessage: {
    color: colors.onSurfaceVariant,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  lastSender: {
    color: colors.onSurface,
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    minWidth: 20,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 3,
    textAlign: 'center',
  },
  readMark: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  groupMeta: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  helpCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 16,
  },
  helpTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  helpText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  helpLink: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  floatingButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 28,
    bottom: 24,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 22,
    width: 56,
  },
  floatingButtonText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 36,
  },
})
