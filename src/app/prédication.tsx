import { EmptySection, ScreenLayout } from "../components/ScreenLayout";

export default function PredicationScreen() {
  return (
    <ScreenLayout
      title="Prédication"
      description="Un espace simple pour préparer le contenu de la prédication."
    >
      <EmptySection label="Aucun contenu pour le moment." />
    </ScreenLayout>
  );
}
