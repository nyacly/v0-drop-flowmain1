import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useAuth } from "@/hooks/useAuth"
import { useDelivery } from "@/hooks/useDelivery"

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const { resetDemoData } = useDelivery()

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.meta}>{user ? user.email : "Guest"}</Text>
        {user?.firstName || user?.lastName ? (
          <Text style={styles.meta}>{[user?.firstName, user?.lastName].filter(Boolean).join(" ")}</Text>
        ) : null}
        <TouchableOpacity style={styles.primaryButton} onPress={logout}>
          <Text style={styles.primaryText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Demo data</Text>
        <Text style={styles.meta}>Restore the seeded addresses, routes, and stops.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={resetDemoData}>
          <Text style={styles.secondaryText}>Reset demo content</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>About</Text>
        <Text style={styles.meta}>
          DropFlow Mobile keeps your delivery planning available offline. Routes and authentication are stored securely on your
          device using AsyncStorage.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  meta: {
    color: "#9ca3af",
  },
  primaryButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryText: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
})
