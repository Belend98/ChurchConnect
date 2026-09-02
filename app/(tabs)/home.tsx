import { EmptySection, ScreenLayout } from '@/presentation/components/ScreenLayout'

export default function HomeScreen() {
  return (
    <ScreenLayout
      title="Accueil"
      description="Le point d'entrée des fonctionnalités principales."
    >
      <EmptySection label="Les fonctionnalités principales seront branchées depuis src." />
    </ScreenLayout>
  )
}
