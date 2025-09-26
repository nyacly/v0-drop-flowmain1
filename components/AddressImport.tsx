"use client"

import { useState } from "react"
import { StyleSheet, Alert, ScrollView } from "react-native"
import { View, Text, Button, Card, Input } from "../theme"
import { useStops } from "../contexts/StopsContext"
import { usePaywallGuard } from "./PaywallGuard"
import type { Stop } from "../types/route"

interface AddressImportProps {
  onImportComplete?: () => void
}

export default function AddressImport({ onImportComplete }: AddressImportProps) {
  const [textInput, setTextInput] = useState("")
  const [singleAddress, setSingleAddress] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { stops, addStop, setStops } = useStops()
  const { checkStopLimit } = usePaywallGuard()

  const generateStopId = () => {
    return `stop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    // In a real app, this would use Google Geocoding API
    // For now, we'll return mock coordinates around Brisbane
    const mockCoordinates = [
      { lat: -27.4698, lng: 153.0251 }, // Brisbane CBD
      { lat: -27.4705, lng: 153.026 }, // South Brisbane
      { lat: -27.468, lng: 153.028 }, // Fortitude Valley
      { lat: -27.472, lng: 153.024 }, // West End
      { lat: -27.465, lng: 153.03 }, // New Farm
    ]

    // Return a random coordinate for demo purposes
    const randomIndex = Math.floor(Math.random() * mockCoordinates.length)
    return mockCoordinates[randomIndex]
  }

  const createStopFromAddress = async (address: string, index: number): Promise<Stop> => {
    const geo = await geocodeAddress(address)

    return {
      id: generateStopId(),
      label: `Stop ${index + 1}`,
      rawAddress: address.trim(),
      notes: "",
      status: "pending",
      geo: geo || undefined,
      coordinate: {
        latitude: geo?.lat || -27.4698,
        longitude: geo?.lng || 153.0251,
      },
    }
  }

  const handleAddSingleAddress = async () => {
    if (!singleAddress.trim()) {
      Alert.alert("Error", "Please enter an address")
      return
    }

    // Check paywall limit before adding
    if (!checkStopLimit(stops.length + 1)) {
      return
    }

    setIsProcessing(true)
    try {
      const newStop = await createStopFromAddress(singleAddress, stops.length)
      addStop(newStop)
      setSingleAddress("")
      Alert.alert("Success", "Address added successfully!")
      onImportComplete?.()
    } catch (error) {
      Alert.alert("Error", "Failed to add address. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkImport = async () => {
    if (!textInput.trim()) {
      Alert.alert("Error", "Please enter addresses to import")
      return
    }

    const addresses = textInput
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0)

    if (addresses.length === 0) {
      Alert.alert("Error", "No valid addresses found")
      return
    }

    // Check paywall limit before importing
    if (!checkStopLimit(stops.length + addresses.length)) {
      return
    }

    setIsProcessing(true)
    try {
      const newStops: Stop[] = []

      for (let i = 0; i < addresses.length; i++) {
        const stop = await createStopFromAddress(addresses[i], stops.length + i)
        newStops.push(stop)
      }

      // Add all new stops
      setStops([...stops, ...newStops])
      setTextInput("")

      Alert.alert(
        "Import Complete",
        `Successfully imported ${addresses.length} address${addresses.length > 1 ? "es" : ""}!`,
      )
      onImportComplete?.()
    } catch (error) {
      Alert.alert("Error", "Failed to import addresses. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClearAll = () => {
    if (stops.length === 0) {
      Alert.alert("Info", "No addresses to clear")
      return
    }

    Alert.alert(
      "Clear All Addresses",
      `Are you sure you want to remove all ${stops.length} address${stops.length > 1 ? "es" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            setStops([])
            Alert.alert("Success", "All addresses cleared")
          },
        },
      ],
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headline">Import Addresses</Text>
        <Text variant="body" color="secondary">
          Add delivery addresses to create your route
        </Text>
      </View>

      {/* Current Stops Summary */}
      <Card style={styles.summaryCard}>
        <Text variant="subtitle">Current Route</Text>
        <Text variant="body" color="secondary">
          {stops.length} address{stops.length !== 1 ? "es" : ""} added
        </Text>
        {stops.length > 0 && (
          <Button variant="outline" onPress={handleClearAll} style={styles.clearButton}>
            Clear All
          </Button>
        )}
      </Card>

      {/* Single Address Input */}
      <Card style={styles.inputCard}>
        <Text variant="subtitle">Add Single Address</Text>
        <Text variant="caption" color="secondary" style={styles.description}>
          Enter one address at a time
        </Text>

        <Input
          value={singleAddress}
          onChangeText={setSingleAddress}
          placeholder="123 Main St, Brisbane QLD 4000"
          style={styles.input}
          multiline={false}
        />

        <Button onPress={handleAddSingleAddress} disabled={isProcessing || !singleAddress.trim()} style={styles.button}>
          {isProcessing ? "Adding..." : "Add Address"}
        </Button>
      </Card>

      {/* Bulk Import */}
      <Card style={styles.inputCard}>
        <Text variant="subtitle">Bulk Import</Text>
        <Text variant="caption" color="secondary" style={styles.description}>
          Enter multiple addresses, one per line
        </Text>

        <Input
          value={textInput}
          onChangeText={setTextInput}
          placeholder={`123 Main St, Brisbane QLD 4000\n456 Queen St, Brisbane QLD 4000\n789 King St, Brisbane QLD 4000`}
          multiline
          style={styles.textArea}
        />

        <Button onPress={handleBulkImport} disabled={isProcessing || !textInput.trim()} style={styles.button}>
          {isProcessing ? "Importing..." : "Import Addresses"}
        </Button>
      </Card>

      {/* Instructions */}
      <Card style={styles.instructionsCard}>
        <Text variant="subtitle">Tips</Text>
        <View style={styles.tipsList}>
          <Text variant="body" style={styles.tip}>
            • Include full addresses with suburb and postcode
          </Text>
          <Text variant="body" style={styles.tip}>
            • One address per line for bulk import
          </Text>
          <Text variant="body" style={styles.tip}>
            • Free users can add up to 10 addresses
          </Text>
          <Text variant="body" style={styles.tip}>
            • Addresses will be automatically geocoded for mapping
          </Text>
        </View>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 20,
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
    borderColor: "#e9ecef",
    borderWidth: 1,
  },
  clearButton: {
    marginTop: 12,
  },
  inputCard: {
    marginBottom: 16,
  },
  description: {
    marginTop: 4,
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  textArea: {
    marginBottom: 12,
    height: 120,
    textAlignVertical: "top",
  },
  button: {
    marginTop: 8,
  },
  instructionsCard: {
    marginBottom: 32,
    backgroundColor: "#fff3cd",
    borderColor: "#ffeaa7",
    borderWidth: 1,
  },
  tipsList: {
    marginTop: 8,
  },
  tip: {
    marginBottom: 4,
    fontSize: 14,
  },
})
