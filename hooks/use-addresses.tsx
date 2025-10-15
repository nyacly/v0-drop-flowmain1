"use client"

import type React from "react"
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react"

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

// Helper function to wait for Google Maps API to load
const waitForGoogleMaps = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.maps) {
      resolve(true)
      return
    }

    let attempts = 0
    const maxAttempts = 50 // 5 seconds total (50 * 100ms)

    const checkInterval = setInterval(() => {
      attempts++

      if (typeof window !== 'undefined' && window.google?.maps) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 100)
  })
}

// Real geocoding using Google Maps Geocoding API
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const isReady = await waitForGoogleMaps()

  if (!isReady) {
    console.error('Google Maps API not loaded')
    return null
  }

  try {
    const geocoder = new window.google.maps.Geocoder()
    const result = await geocoder.geocode({ address })

    if (result.results && result.results.length > 0) {
      const location = result.results[0].geometry.location
      return {
        lat: location.lat(),
        lng: location.lng()
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
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

interface AddressesContextValue {
  addresses: Address[]
  routes: DeliveryRoute[]
  addAddress: (address: string, description?: string) => Promise<Address>
  addAddresses: (addressList: { address: string; description: string }[]) => Promise<{
    added: Address[]
    errors: string[]
    corrected: string[]
  }>
  removeAddress: (id: string) => void
  updateAddress: (id: string, updates: Partial<Address>) => void
  createRoute: (name: string, selectedAddresses?: Address[]) => DeliveryRoute
  updateRoute: (id: string, updates: Partial<DeliveryRoute>) => void
  deleteRoute: (id: string) => void
}

const AddressesContext = createContext<AddressesContextValue | undefined>(undefined)

const STORAGE_KEYS = {
  addresses: "dropflow-addresses",
  routes: "dropflow-routes",
} as const

type StateUpdater<T> = T | ((previous: T) => T)

export const AddressesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [routes, setRoutes] = useState<DeliveryRoute[]>([])

  // Load data from localStorage on initial mount
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const savedAddresses = window.localStorage.getItem(STORAGE_KEYS.addresses)
      const savedRoutes = window.localStorage.getItem(STORAGE_KEYS.routes)

      if (savedAddresses) {
        setAddresses(JSON.parse(savedAddresses))
      }

      if (savedRoutes) {
        setRoutes(JSON.parse(savedRoutes))
      }
    } catch (error) {
      console.error("Error loading DropFlow data from localStorage:", error)
    }
  }, [])

  const persistAddresses = useCallback((next: StateUpdater<Address[]>) => {
    setAddresses((previous) => {
      const resolved = typeof next === "function" ? (next as (prev: Address[]) => Address[])(previous) : next

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS.addresses, JSON.stringify(resolved))
      }

      return resolved
    })
  }, [])

  const persistRoutes = useCallback((next: StateUpdater<DeliveryRoute[]>) => {
    setRoutes((previous) => {
      const resolved = typeof next === "function" ? (next as (prev: DeliveryRoute[]) => DeliveryRoute[])(previous) : next

      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEYS.routes, JSON.stringify(resolved))
      }

      return resolved
    })
  }, [])

  const addAddress = useCallback(
    async (address: string, description = "") => {
      const validation = validateAddress(address)

      if (!validation.isValid) {
        throw new Error(`Invalid address: ${validation.errors.join(", ")}`)
      }

      const isDuplicate = addresses.some(
        (addr) => addr.address.toLowerCase().trim() === validation.corrected.toLowerCase().trim(),
      )

      if (isDuplicate) {
        throw new Error("Address already exists")
      }

      const coordinates = await geocodeAddress(validation.corrected)

      if (coordinates === null) {
        throw new Error("Unable to geocode address. Please check the address format.")
      }

      const newAddress: Address = {
        id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        address: validation.corrected,
        description,
        dateAdded: new Date().toISOString(),
        timesUsed: 0,
        coordinates,
      }

      persistAddresses((prev) => [...prev, newAddress])
      return newAddress
    },
    [addresses, persistAddresses],
  )

  const addAddresses = useCallback(
    async (addressList: { address: string; description: string }[]) => {
      const uniqueAddressList = removeDuplicates(addressList)

      const newAddresses: Address[] = []
      const errors: string[] = []
      const corrected: string[] = []

      for (const { address, description } of uniqueAddressList) {
        try {
          const validation = validateAddress(address)

          if (!validation.isValid) {
            errors.push(`Invalid address "${address}": ${validation.errors.join(", ")}`)
            continue
          }

          if (validation.corrected !== address.trim()) {
            corrected.push(`"${address}" → "${validation.corrected}"`)
          }

          const isDuplicateInExisting = addresses.some(
            (addr) => addr.address.toLowerCase().trim() === validation.corrected.toLowerCase().trim(),
          )

          if (isDuplicateInExisting) {
            errors.push(`Duplicate address: ${validation.corrected}`)
            continue
          }

          const isDuplicateInNew = newAddresses.some(
            (addr) => addr.address.toLowerCase().trim() === validation.corrected.toLowerCase().trim(),
          )

          if (isDuplicateInNew) {
            errors.push(`Duplicate in import: ${validation.corrected}`)
            continue
          }

          const coordinates = await geocodeAddress(validation.corrected)

          if (coordinates === null) {
            errors.push(`Failed to geocode: ${validation.corrected}`)
            continue
          }

          const newAddress: Address = {
            id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            address: validation.corrected,
            description,
            dateAdded: new Date().toISOString(),
            timesUsed: 0,
            coordinates,
          }

          newAddresses.push(newAddress)
        } catch (error) {
          errors.push(`Error adding ${address}: ${error}`)
        }
      }

      if (newAddresses.length > 0) {
        persistAddresses((prev) => [...prev, ...newAddresses])
      }

      return { added: newAddresses, errors, corrected }
    },
    [addresses, persistAddresses],
  )

  const removeAddress = useCallback(
    (id: string) => {
      persistAddresses((prev) => prev.filter((addr) => addr.id !== id))
    },
    [persistAddresses],
  )

  const updateAddress = useCallback(
    (id: string, updates: Partial<Address>) => {
      persistAddresses((prev) => prev.map((addr) => (addr.id === id ? { ...addr, ...updates } : addr)))
    },
    [persistAddresses],
  )

  const createRoute = useCallback(
    (name: string, selectedAddresses: Address[] = []) => {
      const newRoute: DeliveryRoute = {
        id: `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        addresses: selectedAddresses,
        createdAt: new Date().toISOString(),
        status: "draft",
      }

      if (selectedAddresses.length > 0) {
        const updatedAddresses = addresses.map((addr) => {
          const isSelected = selectedAddresses.some((selected) => selected.id === addr.id)
          return isSelected ? { ...addr, timesUsed: addr.timesUsed + 1 } : addr
        })
        persistAddresses(updatedAddresses)
      }

      persistRoutes((prev) => [...prev, newRoute])
      return newRoute
    },
    [addresses, persistAddresses, persistRoutes],
  )

  const updateRoute = useCallback(
    (id: string, updates: Partial<DeliveryRoute>) => {
      persistRoutes((prev) => prev.map((route) => (route.id === id ? { ...route, ...updates } : route)))
    },
    [persistRoutes],
  )

  const deleteRoute = useCallback(
    (id: string) => {
      persistRoutes((prev) => prev.filter((route) => route.id !== id))
    },
    [persistRoutes],
  )

  const value = useMemo(
    () => ({
      addresses,
      routes,
      addAddress,
      addAddresses,
      removeAddress,
      updateAddress,
      createRoute,
      updateRoute,
      deleteRoute,
    }),
    [
      addAddress,
      addAddresses,
      addresses,
      createRoute,
      deleteRoute,
      removeAddress,
      routes,
      updateAddress,
      updateRoute,
    ],
  )

  return <AddressesContext.Provider value={value}>{children}</AddressesContext.Provider>
}

export function useAddresses() {
  const context = useContext(AddressesContext)

  if (!context) {
    throw new Error("useAddresses must be used within an AddressesProvider")
  }

  return context
}
