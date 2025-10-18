import { useMemo, useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from "react-native"
import { useDelivery } from "@/hooks/useDelivery"

export default function PlanScreen() {
  const { activeRoute, activeStops, updateStopStatus, reorderStops, completeRoute, isReady } = useDelivery()
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const currentStop = useMemo(() => activeStops.find((stop) => stop.id === selectedStopId), [activeStops, selectedStopId])

  useEffect(() => {
    if (currentStop) {
      setNote(currentStop.notes ?? "")
    } else {
      setNote("")
    }
  }, [currentStop?.id, currentStop?.notes])

  const handleComplete = () => {
    Alert.alert("Complete delivery", "Mark this route as finished?", [
      { text: "Cancel", style: "cancel" },
      { text: "Complete", style: "destructive", onPress: completeRoute },
    ])
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>Loading plan...</Text>
      </View>
    )
  }

  if (!activeRoute) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No active route</Text>
        <Text style={styles.info}>Start a route from the Routes tab to manage deliveries.</Text>
      </View>
    )
  }

  const pending = activeStops.filter((stop) => stop.status === "pending").length
  const completed = activeStops.filter((stop) => stop.status === "completed").length
  const skipped = activeStops.filter((stop) => stop.status === "skipped").length

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{activeRoute.name}</Text>
        <Text style={styles.info}>{activeStops.length} stops • {completed} completed • {pending} remaining</Text>
        {skipped > 0 && <Text style={styles.warning}>{skipped} skipped</Text>}
        <TouchableOpacity
          style={[styles.primaryButton, pending > 0 && styles.disabledButton]}
          onPress={handleComplete}
          disabled={pending > 0}
        >
          <Text style={styles.primaryButtonText}>Mark route complete</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeStops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Stops</Text>}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.stopCard, item.status !== "pending" && styles.stopCardCompleted, selectedStopId === item.id && styles.stopCardSelected]}
            onPress={() => {
              setSelectedStopId(item.id)
              setNote(item.notes ?? "")
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.stopOrder}>#{index + 1}</Text>
              <Text style={styles.stopAddress}>{item.address}</Text>
              {item.notes ? <Text style={styles.stopNotes}>{item.notes}</Text> : null}
              <Text style={[styles.status, styles[`status${capitalize(item.status)}` as const]]}>{capitalize(item.status)}</Text>
            </View>
            <View style={styles.stopActions}>
              <TouchableOpacity style={styles.moveButton} onPress={() => reorderStops(index, Math.max(0, index - 1))}>
                <Text style={styles.moveButtonText}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.moveButton}
                onPress={() => reorderStops(index, Math.min(activeStops.length - 1, index + 1))}
              >
                <Text style={styles.moveButtonText}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, styles.statusButtonCompleted]}
                onPress={() => updateStopStatus(item.id, "completed")}
              >
                <Text style={styles.statusButtonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusButton, styles.statusButtonPending]} onPress={() => updateStopStatus(item.id, "pending")}>
                <Text style={styles.statusButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statusButton, styles.statusButtonSkipped]} onPress={() => updateStopStatus(item.id, "skipped")}>
                <Text style={styles.statusButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No stops loaded</Text>
            <Text style={styles.emptyText}>Routes need at least one address before you can start them.</Text>
          </View>
        )}
      />

      {currentStop ? (
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Notes for {currentStop.address}</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Proof of delivery, access notes, etc."
            placeholderTextColor="#6b7280"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => updateStopStatus(currentStop.id, currentStop.status, note.trim() || undefined)}
          >
            <Text style={styles.primaryButtonText}>Save note</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
    gap: 8,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  info: {
    color: "#9ca3af",
  },
  warning: {
    color: "#fde68a",
  },
  primaryButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 16,
  },
  stopCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    marginBottom: 12,
    flexDirection: "row",
    gap: 12,
  },
  stopCardCompleted: {
    borderColor: "#16a34a",
  },
  stopCardSelected: {
    borderColor: "#3b82f6",
  },
  stopOrder: {
    color: "#9ca3af",
    fontWeight: "600",
  },
  stopAddress: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  stopNotes: {
    color: "#d1d5db",
  },
  stopActions: {
    gap: 6,
    alignItems: "flex-end",
  },
  moveButton: {
    backgroundColor: "#1f2937",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  moveButtonText: {
    color: "#e5e7eb",
    fontWeight: "700",
  },
  statusButton: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusButtonCompleted: {
    backgroundColor: "#16a34a",
  },
  statusButtonPending: {
    backgroundColor: "#374151",
  },
  statusButtonSkipped: {
    backgroundColor: "#f59e0b",
  },
  statusButtonText: {
    color: "white",
    fontWeight: "600",
  },
  status: {
    marginTop: 4,
    fontWeight: "600",
  },
  statusPending: {
    color: "#fde68a",
  },
  statusCompleted: {
    color: "#bbf7d0",
  },
  statusSkipped: {
    color: "#fbbf24",
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
  notesCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 12,
    marginBottom: 24,
  },
  notesInput: {
    backgroundColor: "#1f2937",
    color: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 96,
    textAlignVertical: "top",
  },
})
