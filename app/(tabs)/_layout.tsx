import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="predication" options={{ title: 'Prédication' }} />
      <Tabs.Screen name="groupe" options={{ title: 'Groupe' }} />
    </Tabs>
  )
}
