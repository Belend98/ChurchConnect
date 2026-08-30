import { EmptySection, ScreenLayout } from "../components/ScreenLayout";

export default function GroupeScreen() {
  return (
    <ScreenLayout
      title="Groupe"
      description="Un écran prêt à accueillir les informations du groupe."
    >
      <EmptySection label="Aucun groupe affiché pour le moment." />
    </ScreenLayout>
  );
}
