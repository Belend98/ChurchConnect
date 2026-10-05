import { useAccessRequests } from '@/presentation/hooks/profil/useAccessRequests'
import { colors } from '@/shared/theme/colors'
import { SymbolView } from 'expo-symbols'
import { Tabs } from 'expo-router'
import { type ColorValue, Platform, StyleSheet, View } from 'react-native'

type TabIconName = {
  android: 'home' | 'campaign' | 'groups' | 'person' | 'how_to_reg'
  ios: 'house.fill' | 'megaphone.fill' | 'person.3.fill' | 'person.crop.circle.fill' | 'person.badge.plus'
  web: 'home' | 'campaign' | 'groups' | 'person' | 'how_to_reg'
}

function TabIcon({
  color,
  focused,
  name,
}: {
  color: ColorValue
  focused: boolean
  name: TabIconName
}) {
  return (
    <View style={[styles.iconShell, focused && styles.activeIconShell]}>
      <SymbolView
        name={name}
        size={22}
        tintColor={focused ? colors.surfaceContainerLowest : color}
        type="hierarchical"
      />
    </View>
  )
}

export default function TabLayout() {
  const { canManage, data: requests = [] } = useAccessRequests()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 3,
        },
        tabBarStyle: {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.outline,
          borderTopWidth: Platform.OS === 'ios' ? 0 : 1,
          elevation: 10,
          height: 76,
          paddingBottom: 12,
          paddingHorizontal: 8,
          paddingTop: 8,
          shadowColor: colors.primary,
          shadowOffset: { height: -3, width: 0 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              name={{ android: 'home', ios: 'house.fill', web: 'home' }}
            />
          ),
          title: 'Accueil',
        }}
      />
      <Tabs.Screen
        name="predication"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              name={{
                android: 'campaign',
                ios: 'megaphone.fill',
                web: 'campaign',
              }}
            />
          ),
          title: 'Prédications',
        }}
      />
      <Tabs.Screen
        name="groupe"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              name={{ android: 'groups', ios: 'person.3.fill', web: 'groups' }}
            />
          ),
          title: 'Groupes',
        }}
      />
      <Tabs.Screen
        name="mon-espace"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              color={color}
              focused={focused}
              name={{
                android: 'person',
                ios: 'person.crop.circle.fill',
                web: 'person',
              }}
            />
          ),
          title: 'Espace',
        }}
      />
      <Tabs.Protected guard={canManage}>
        <Tabs.Screen name="demandes" options={{
          title: 'Demandes',
          tabBarBadge: requests.length || undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused}
              name={{ android: 'how_to_reg', ios: 'person.badge.plus', web: 'how_to_reg' }} />
          ),
        }} />
      </Tabs.Protected>
    </Tabs>
  )
}

const styles = StyleSheet.create({
  activeIconShell: {
    backgroundColor: colors.primary,
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 46,
  },
  tabItem: {
    minHeight: 56,
    paddingVertical: 3,
  },
})
