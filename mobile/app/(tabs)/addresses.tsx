import { useMemo, useState } from "react"
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from "react-native"
import { useDelivery } from "@/hooks/useDelivery"
import { autoCorrectAddress, validateAddress } from "@/utils/address"
import { format } from "date-fns"

export default function AddressesScreen() {
  const { addresses, addAddress, removeAddress, isReady } = useDelivery()
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isSaving, setSaving] = useState(false)

  const sortedAddresses = useMemo(
    () => [...addresses].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()),
    [addresses],
  )

  const handleAdd = async () => {
    setErrors([])
    if (!address.trim()) {
      setErrors(["Address is required"])
      return
    }

    const validation = validateAddress(address)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setSaving(true)
    try {
      await addAddress({ address: validation.corrected, description: description.trim() })
      setAddress("")
      setDescription("")
    } catch (error: any) {
      setErrors([error.message ?? "Failed to save address"])
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (id: string) => {
    Alert.alert("Remove address", "Are you sure you want to delete this saved address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => removeAddress(id),
      },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Add a delivery stop</Text>
        <Text style={styles.description}>Addresses are auto-corrected and synced to every route.</Text>
        <TextInput
          style={styles.input}
          placeholder="742 Evergreen Terrace"
          placeholderTextColor="#6b7280"
          value={address}
          onChangeText={(value) => {
            setAddress(value)
            setErrors([])
          }}
          editable={!isSaving && isReady}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notes (gate codes, preferred contact, delivery instructions)"
          placeholderTextColor="#6b7280"
          value={description}
          onChangeText={setDescription}
          editable={!isSaving && isReady}
          multiline
          numberOfLines={3}
        />
        {address ? (
          <Text style={styles.suggestion}>Suggested: {autoCorrectAddress(address)}</Text>
        ) : null}
        {errors.length > 0 && (
          <View style={styles.errorBox}>
            {errors.map((error) => (
              <Text key={error} style={styles.errorText}>
                • {error}
              </Text>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[styles.button, (!isReady || isSaving) && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={!isReady || isSaving}
        >
          <Text style={styles.buttonText}>{isSaving ? "Saving..." : "Save address"}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedAddresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={() => (
          <Text style={styles.sectionTitle}>Saved addresses</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.addressCard}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.address}>{item.address}</Text>
              {item.description ? <Text style={styles.notes}>{item.description}</Text> : null}
              <Text style={styles.meta}>{`Added ${format(new Date(item.dateAdded), "MMM d, yyyy")}`}</Text>
              <Text style={styles.meta}>{`Used in ${item.timesUsed} routes`}</Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id)}>
              <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No saved addresses yet</Text>
            <Text style={styles.emptyText}>Add a location above to start building optimized delivery routes.</Text>
          </View>
        )}
      />
    </View>
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
  textArea: {
    height: 96,
    textAlignVertical: "top",
  },
  suggestion: {
    color: "#9ca3af",
    fontSize: 12,
  },
  button: {
    backgroundColor: "#ef4444",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  address: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  notes: {
    color: "#d1d5db",
  },
  meta: {
    color: "#9ca3af",
    fontSize: 12,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#b91c1c",
  },
  deleteText: {
    color: "#fca5a5",
    fontWeight: "600",
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
  errorBox: {
    backgroundColor: "#7f1d1d",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  errorText: {
    color: "#fecaca",
    fontSize: 12,
  },
})
