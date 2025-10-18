import { Stack } from "expo-router"
import { SplashScreen } from "expo-router"
import { useEffect, useState } from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AuthProvider } from "@/contexts/AuthContext"
import { DeliveryProvider } from "@/contexts/DeliveryContext"

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [isReady, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync()
    }
  }, [isReady])

  if (!isReady) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <DeliveryProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </DeliveryProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
