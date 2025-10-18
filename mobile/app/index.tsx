import { Redirect } from "expo-router"
import { View, ActivityIndicator } from "react-native"
import { useAuth } from "@/hooks/useAuth"

export default function Index() {
  const { user, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" }}>
        <ActivityIndicator color="#ef4444" size="large" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/auth" />
  }

  return <Redirect href="/(tabs)/home" />
}
