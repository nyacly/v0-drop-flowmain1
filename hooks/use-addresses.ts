"use client"

import { useState, useEffect } from "react"

export interface Address {
  id: string
  address: string
  description: string
  dateAdded: string
  timesUsed: number
  coordinates?: { lat: number; lng: number }
}

export interface DeliveryRoute {
  id: string
  name: string
  addresses: Address[]
  createdAt: string
  status: "draft" | "active" | "completed"
}

const autoCorrectAddress = (address: string): string => {
  let corrected = address.trim()

  // Remove extra spaces
  corrected = corrected.replace(/\s+/g, " ")

  // Capitalize first letter of each word
  corrected = corrected.replace(/\b\w/g, (char) => char.toUpperCase())

  // Common abbreviation corrections
  const corrections: Record<string, string> = {
    " St ": " Street ",
    " St,": " Street,",
    " St$": " Street",
    " Ave ": " Avenue ",
    " Ave,": " Avenue,",
    " Ave$": " Avenue",
    " Rd ": " Road ",
    " Rd,": " Road,",
    " Rd$": " Road",
    " Dr ": " Drive ",
    " Dr,": " Drive,",
    " Dr$": " Drive",
    " Blvd ": " Boulevard ",
    " Blvd,": " Boulevard,",
    " Blvd$": " Boulevard",
    " Ln ": " Lane ",
    " Ln,": " Lane,",
    " Ln$": " Lane",
    " Ct ": " Court ",
    " Ct,": " Court,",
    " Ct$": " Court",
    " Pl ": " Place ",
    " Pl,": " Place,",
    " Pl$": " Place",
  }

  Object.entries(corrections).forEach(([abbrev, full]) => {
    const regex = new RegExp(abbrev.replace("$", "$").replace(" ", "\\s+"), "gi")
    corrected = corrected.replace(regex, full)
  })

  return corrected
}

const validateAddress = (address: string): { isValid: boolean; corrected: string; errors: string[] } => {
  const errors: string[] = []
  const corrected = autoCorrectAddress(address)

  // Basic validation rules
  if (corrected.length < 5) {
    errors.push("Address too short (minimum 5 characters)")
  }

  if (!/\d/.test(corrected)) {
    errors.push("Address should contain at least one number")
  }

  if (!/[a-zA-Z]/.test(corrected)) {
    errors.push("Address should contain letters")
  }

  // Check for common address components
  const hasStreetType = /\b(street|avenue|road|drive|boulevard|lane|court|place|way|circle|terrace)\b/i.test(corrected)
  if (!hasStreetType) {
    errors.push("Address should include a street type (Street, Avenue, Road, etc.)")
  }

  return {
    isValid: errors.length === 0,
    corrected,
    errors,
  }
}

const removeDuplicates = (
  addressList: { address: string; description: string }[],
): { address: string; description: string }[] => {
  const seen = new Set<string>()
  return addressList.filter(({ address }) => {
    const normalized = address.toLowerCase().trim()
    if (seen.has(normalized)) {
      return false
    }
    seen.add(normalized)
    return true
  })
}

// Simulate geocoding by generating random coordinates around a central point
const generateMockCoordinates = (): { lat: number; lng: number } => {
  // Brisbane, AU
  const centerLat = -27.4705
  const centerLng = 153.026

  // Generate a random point within a ~10km radius
  const lat = centerLat + (Math.random() - 0.5) * 0.2
  const lng = centerLng + (Math.random() - 0.5) * 0.2

  return { lat, lng }
}

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (typeof window === "undefined") {
      return []
    }
    try {
      const savedAddresses = localStorage.getItem("dropflow-addresses")
      return savedAddresses ? JSON.parse(savedAddresses) : []
    } catch (error) {
      console.error("Error loading addresses from localStorage:", error)
      return []
    }
  })

  const [routes, setRoutes] = useState<DeliveryRoute[]>(() => {
    if (typeof window === "undefined") {
      return []
    }
    try {
      const savedRoutes = localStorage.getItem("dropflow-routes")
      return savedRoutes ? JSON.parse(savedRoutes) : []
    } catch (error) {
      console.error("Error loading routes from localStorage:", error)
      return []
    }
  })

  // Save addresses to localStorage
  const saveAddresses = (newAddresses: Address[]) => {
    setAddresses(newAddresses)
    localStorage.setItem("dropflow-addresses", JSON.stringify(newAddresses))
  }

  // Save routes to localStorage
  const saveRoutes = (newRoutes: DeliveryRoute[]) => {
    setRoutes(newRoutes)
    localStorage.setItem("dropflow-routes", JSON.stringify(newRoutes))
  }

  // Add a single address
  const addAddress = (address: string, description = "") => {
    const validation = validateAddress(address)

    if (!validation.isValid) {
      throw new Error(`Invalid address: ${validation.errors.join(", ")}`)
    }

    const newAddress: Address = {
      id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      address: validation.corrected,
      description,
      dateAdded: new Date().toISOString(),
      timesUsed: 0,
      coordinates: generateMockCoordinates(),
    }

    // Check for duplicates using corrected address
    const isDuplicate = addresses.some(
      (addr) => addr.address.toLowerCase().trim() === validation.corrected.toLowerCase().trim(),
    )

    if (isDuplicate) {
      throw new Error("Address already exists")
    }

    saveAddresses([...addresses, newAddress])
    return newAddress
  }

  // Add multiple addresses (bulk import)
  const addAddresses = (addressList: { address: string; description: string }[]) => {
    // Remove duplicates from input list first
    const uniqueAddressList = removeDuplicates(addressList)

    const newAddresses: Address[] = []
    const errors: string[] = []
    const corrected: string[] = []

    uniqueAddressList.forEach(({ address, description }) => {
      try {
        const validation = validateAddress(address)

        if (!validation.isValid) {
          errors.push(`Invalid address "${address}": ${validation.errors.join(", ")}`)
          return
        }

        // Track if address was corrected
        if (validation.corrected !== address.trim()) {
          corrected.push(`"${address}" → "${validation.corrected}"`)
        }

        // Check for duplicates in existing addresses
        const isDuplicateInExisting = addresses.some(
          (addr) => addr.address.toLowerCase().trim() === validation.corrected.toLowerCase().trim(),
        )

        if (isDuplicateInExisting) {
          errors.push(`Duplicate address: ${validation.corrected}`)
          return
        }

        // Check for duplicates within the new list
        const isDuplicateInNew = newAddresses.some(
          (addr) => addr.address.toLowerCase().trim() === validation.corrected.toLowerCase().trim(),
        )

        if (isDuplicateInNew) {
          errors.push(`Duplicate in import: ${validation.corrected}`)
          return
        }

        const newAddress: Address = {
          id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          address: validation.corrected,
          description,
          dateAdded: new Date().toISOString(),
          timesUsed: 0,
          coordinates: generateMockCoordinates(),
        }

        newAddresses.push(newAddress)
      } catch (error) {
        errors.push(`Error adding ${address}: ${error}`)
      }
    })

    if (newAddresses.length > 0) {
      saveAddresses([...addresses, ...newAddresses])
    }

    return { added: newAddresses, errors, corrected }
  }

  // Remove an address
  const removeAddress = (id: string) => {
    const updatedAddresses = addresses.filter((addr) => addr.id !== id)
    saveAddresses(updatedAddresses)
  }

  // Update an address
  const updateAddress = (id: string, updates: Partial<Address>) => {
    const updatedAddresses = addresses.map((addr) => (addr.id === id ? { ...addr, ...updates } : addr))
    saveAddresses(updatedAddresses)
  }

  // Create a new delivery route
  const createRoute = (name: string, selectedAddresses: Address[] = []) => {
    const newRoute: DeliveryRoute = {
      id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      addresses: selectedAddresses,
      createdAt: new Date().toISOString(),
      status: "draft",
    }

    // Increment usage count for selected addresses
    if (selectedAddresses.length > 0) {
      const updatedAddresses = addresses.map((addr) => {
        const isSelected = selectedAddresses.some((selected) => selected.id === addr.id)
        return isSelected ? { ...addr, timesUsed: addr.timesUsed + 1 } : addr
      })
      saveAddresses(updatedAddresses)
    }

    saveRoutes([...routes, newRoute])
    return newRoute
  }

  // Update a route
  const updateRoute = (id: string, updates: Partial<DeliveryRoute>) => {
    const updatedRoutes = routes.map((route) => (route.id === id ? { ...route, ...updates } : route))
    saveRoutes(updatedRoutes)
  }

  // Delete a route
  const deleteRoute = (id: string) => {
    const updatedRoutes = routes.filter((route) => route.id !== id)
    saveRoutes(updatedRoutes)
  }

  return {
    addresses,
    routes,
    addAddress,
    addAddresses,
    removeAddress,
    updateAddress,
    createRoute,
    updateRoute,
    deleteRoute,
  }
}
