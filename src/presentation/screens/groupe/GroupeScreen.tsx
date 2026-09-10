import { groupeService } from '@/composition/groupe'
import type { GroupeModel } from '@/domain/entités/Groupe'
import { colors } from '@/shared/theme/colors'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

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
            <Text style={styles.eyebrow}>Communauté</Text>
            <Text style={styles.title}>Mes groupes</Text>
          </View>
          <Pressable onPress={openCreateGroupe} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Créer</Text>
          </Pressable>
        </View>

        <Text style={styles.meta}>
          {isLoading ? 'Chargement' : `${groups.length} groupe(s)`}
        </Text>

        <View style={styles.groupList}>
          {groups.map((group) => (
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

                <Text numberOfLines={1} style={styles.lastMessage}>
                  {group.description ?? 'Aucune description.'}
                </Text>

                <Text style={styles.groupMeta}>
                  {group.createdBy ? 'Groupe actif' : 'Groupe'}
                </Text>
              </View>
              <Text style={styles.groupArrow}>›</Text>
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
  meta: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  groupList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 10,
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
