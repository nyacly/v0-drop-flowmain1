import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { useDelivery } from "@/hooks/useDelivery"
import { useAuth } from "@/hooks/useAuth"
import { format } from "date-fns"

export default function HomeScreen() {
  const router = useRouter()
  const { addresses, routes, activeRoute, activeStops, isReady } = useDelivery()
  const { user } = useAuth()

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "white" }}>Preparing your workspace…</Text>
      </View>
    )
  }

  const completedStops = activeStops.filter((stop) => stop.status === "completed").length
  const pendingStops = activeStops.filter((stop) => stop.status === "pending").length

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <Text style={styles.heading}>DropFlow overview</Text>

      <View style={styles.cardGrid}>
        <SummaryCard
          title="Saved addresses"
          value={String(addresses.length)}
          subtitle="Optimized and ready for route planning"
          onPress={() => router.push("/(tabs)/addresses")}
        />
        <SummaryCard
          title="Delivery routes"
          value={String(routes.length)}
          subtitle="Draft, active, and completed"
          onPress={() => router.push("/(tabs)/routes")}
        />
        <SummaryCard
          title="Active stops"
          value={String(activeStops.length)}
          subtitle={activeRoute ? `${completedStops} done • ${pendingStops} remaining` : "Start a route to begin"}
          onPress={() => router.push("/(tabs)/plan")}
        />
      </View>

      {activeRoute ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Currently running</Text>
          <Text style={styles.cardValue}>{activeRoute.name}</Text>
          <Text style={styles.cardMeta}>
            {format(new Date(activeRoute.createdAt), "MMM d, yyyy • h:mm a")} • {activeStops.length} stops
          </Text>
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, { flex: activeStops.length ? completedStops : 1 }]} />
            <View style={[styles.progressBarPending, { flex: pendingStops }]} />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.primaryButton]} onPress={() => router.push("/(tabs)/plan")}>
              <Text style={styles.primaryButtonText}>Open delivery plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No active delivery</Text>
          <Text style={styles.cardMeta}>Build a route to launch your next run.</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(tabs)/routes")}>
              <Text style={styles.primaryButtonText}>Plan new route</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(tabs)/addresses")}>
              <Text style={styles.secondaryButtonText}>Manage addresses</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.cardMeta}>{user ? `Signed in as ${user.email}` : "Guest session"}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(tabs)/profile")}>
          <Text style={styles.secondaryButtonText}>Profile & settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  onPress,
}: {
  title: string
  value: string
  subtitle: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.summaryCard} onPress={onPress}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summarySubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    padding: 16,
  },
  heading: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    width: "100%",
  },
  summaryValue: {
    color: "#ef4444",
    fontSize: 32,
    fontWeight: "700",
  },
  summaryTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  summarySubtitle: {
    color: "#9ca3af",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginTop: 16,
    gap: 8,
  },
  cardTitle: {
    color: "#9ca3af",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  cardMeta: {
    color: "#9ca3af",
  },
  progressRow: {
    flexDirection: "row",
    height: 8,
    borderRadius: 9999,
    overflow: "hidden",
    backgroundColor: "#1f2937",
    marginTop: 12,
  },
  progressBar: {
    backgroundColor: "#ef4444",
  },
  progressBarPending: {
    backgroundColor: "#374151",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: "#e5e7eb",
    fontWeight: "500",
  },
  loading: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
})
