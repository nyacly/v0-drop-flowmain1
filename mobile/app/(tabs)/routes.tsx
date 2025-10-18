import { useMemo, useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Switch } from "react-native"
import { format } from "date-fns"
import { useDelivery } from "@/hooks/useDelivery"

export default function RoutesScreen() {
  const { routes, addresses, createRoute, deleteRoute, startRoute, activeRoute, isReady } = useDelivery()
  const [routeName, setRouteName] = useState("")
  const [selectedAddressIds, setSelectedAddressIds] = useState<string[]>([])
  const [isCreating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedRoutes = useMemo(
    () => [...routes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [routes],
  )

  const toggleAddress = (id: string) => {
    setSelectedAddressIds((prev) => (prev.includes(id) ? prev.filter((addrId) => addrId !== id) : [...prev, id]))
  }

  const handleCreate = async () => {
    setError(null)
    if (!routeName.trim()) {
      setError("Route name is required")
      return
    }
    if (selectedAddressIds.length === 0) {
      setError("Select at least one address")
      return
    }

    setCreating(true)
    try {
      await createRoute({
        name: routeName.trim(),
        addressIds: selectedAddressIds,
      })
      setRouteName("")
      setSelectedAddressIds([])
    } catch (error: any) {
      setError(error.message ?? "Unable to create route")
    } finally {
      setCreating(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Build a delivery route</Text>
        <Text style={styles.description}>Select the stops to include and DropFlow will keep them synced.</Text>
        <TextInput
          style={styles.input}
          placeholder="Morning run"
          placeholderTextColor="#6b7280"
          value={routeName}
          onChangeText={setRouteName}
          editable={!isCreating && isReady}
        />
        <View style={styles.addressList}>
          {addresses.length === 0 ? (
            <Text style={styles.emptyAddresses}>Add addresses first to create a route.</Text>
          ) : (
            addresses.map((address) => (
              <View key={address.id} style={styles.addressRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.address}>{address.address}</Text>
                  {address.description ? <Text style={styles.notes}>{address.description}</Text> : null}
                </View>
                <Switch value={selectedAddressIds.includes(address.id)} onValueChange={() => toggleAddress(address.id)} />
              </View>
            ))
          )}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, (!isReady || isCreating || selectedAddressIds.length === 0) && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!isReady || isCreating || selectedAddressIds.length === 0}
        >
          <Text style={styles.buttonText}>{isCreating ? "Creating..." : "Create route"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedRoutes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Your routes</Text>}
        renderItem={({ item }) => {
          const isActive = activeRoute?.id === item.id
          return (
            <View style={[styles.routeCard, isActive && styles.routeCardActive]}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.routeName}>{item.name}</Text>
                <Text style={styles.meta}>{format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}</Text>
                <Text style={styles.meta}>{`${item.addresses.length} stops`}</Text>
                <Text style={[styles.status, styles[`status${capitalize(item.status)}` as const]]}>{capitalize(item.status)}</Text>
                <View style={{ gap: 2 }}>
                  {item.addresses.map((address) => (
                    <Text key={address.id} style={styles.stop}>
                      • {address.address}
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.routeActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => deleteRoute(item.id)}>
                  <Text style={styles.secondaryText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, (!isReady || item.addresses.length === 0) && styles.buttonDisabled]}
                  onPress={() => startRoute(item.id)}
                  disabled={!isReady || item.addresses.length === 0}
                >
                  <Text style={styles.buttonText}>{isActive ? "Resume" : "Start"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No routes yet</Text>
            <Text style={styles.emptyText}>Create your first route above to begin planning deliveries.</Text>
          </View>
        )}
      />
    </View>
  )
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

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
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    color: "#9ca3af",
  },
  input: {
    backgroundColor: "#1f2937",
    color: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addressList: {
    gap: 12,
  },
  addressRow: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  address: {
    color: "white",
    fontWeight: "600",
  },
  notes: {
    color: "#d1d5db",
  },
  emptyAddresses: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  error: {
    color: "#fca5a5",
  },
  button: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  routeCardActive: {
    borderColor: "#ef4444",
  },
  routeName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  meta: {
    color: "#9ca3af",
  },
  status: {
    fontWeight: "600",
    marginTop: 8,
  },
  statusDraft: {
    color: "#9ca3af",
  },
  statusActive: {
    color: "#fde68a",
  },
  statusCompleted: {
    color: "#bbf7d0",
  },
  stop: {
    color: "#d1d5db",
  },
  routeActions: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  primaryButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  secondaryText: {
    color: "#e5e7eb",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
    gap: 8,
  },
  emptyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
  },
})
