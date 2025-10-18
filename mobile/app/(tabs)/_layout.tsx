import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/hooks/useAuth"

export default function TabsLayout() {
  const { user } = useAuth()

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "white",
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1f2937" },
        tabBarActiveTintColor: "#ef4444",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            home: "home-outline",
            addresses: "navigate-outline",
            routes: "map-outline",
            plan: "list-outline",
            profile: "person-circle-outline",
          }
          const iconName = iconMap[route.name] ?? "ellipse-outline"
          return <Ionicons name={iconName} color={color} size={size} />
        },
        headerTitle: route.name === "home" ? `Welcome${user ? `, ${user.firstName ?? user.email}` : ""}` : undefined,
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Overview" }} />
      <Tabs.Screen name="addresses" options={{ title: "Addresses" }} />
      <Tabs.Screen name="routes" options={{ title: "Routes" }} />
      <Tabs.Screen name="plan" options={{ title: "Delivery Plan" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  )
}
