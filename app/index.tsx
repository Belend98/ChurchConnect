import { useInitialRoute } from '@/presentation/hooks/auth/useInitialRoute'
import { ActivityIndicator, View } from 'react-native'

export default function Index() {
  useInitialRoute()

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  )
}
