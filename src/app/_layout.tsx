import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="prédication" options={{ title: "Prédication" }} />
      <Tabs.Screen name="groupe" options={{ title: "Groupe" }} />
    </Tabs>
  );
}
