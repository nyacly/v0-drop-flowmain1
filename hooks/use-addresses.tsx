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

// Geocode with timeout wrapper
const geocodeWithTimeout = async (
  address: string,
  timeoutMs: number = 10000
): Promise<{ lat: number; lng: number } | null> => {
  const isReady = await waitForGoogleMaps()

  if (!isReady) {
    console.error('Google Maps API not loaded')
    return null
  }

  try {
    const geocoder = new window.google.maps.Geocoder()
    
    const geocodingPromise = geocoder.geocode({ address }).then((result) => {
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location
        return {
          lat: location.lat(),
          lng: location.lng()
        }
      }
      return null
    })

    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), timeoutMs)
    )

    return await Promise.race([geocodingPromise, timeoutPromise])
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// Geocode with retry logic and exponential backoff
const geocodeAddressWithRetry = async (
  address: string
): Promise<{ success: boolean; coordinates: { lat: number; lng: number } | null; attempts: number }> => {
  const maxAttempts = 4 // 1 initial + 3 retries
  const delays = [0, 1000, 2000, 4000] // Exponential backoff: 0ms, 1s, 2s, 4s

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Geocoding attempt ${attempt + 1}/${maxAttempts} for: ${address}`)

    // Wait before retry (skip for first attempt)
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
    }

    const coordinates = await geocodeWithTimeout(address, 10000)

    if (coordinates !== null) {
      console.log(`Geocoding succeeded on attempt ${attempt + 1}`)
      return { success: true, coordinates, attempts: attempt + 1 }
    }

    console.log(`Geocoding attempt ${attempt + 1} failed`)
  }

  console.log(`Geocoding failed after ${maxAttempts} attempts`)
  return { success: false, coordinates: null, attempts: maxAttempts }
}

// Real geocoding using Google Maps Geocoding API
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  return await geocodeWithTimeout(address, 10000)
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
  isGeocoding: boolean
  addAddress: (address: string, description?: string, skipGeocodingCheck?: boolean) => Promise<{ address: Address | null; geocodingFailed: boolean; attemptedAddress?: string }>
  addAddressWithoutGeocoding: (address: string, description?: string) => Promise<Address>
  addAddresses: (
    addressList: { address: string; description: string }[],
    onProgress?: (current: number, total: number, currentAddress: string, successful: number, skipped: number) => void
  ) => Promise<{
    added: Address[]
    errors: string[]
    corrected: string[]
    skipped: string[]
  }>
  removeAddress: (id: string) => void
  updateAddress: (id: string, updates: Partial<Address>) => void
  createRoute: (name: string, selectedAddresses?: Address[]) => DeliveryRoute
  updateRoute: (id: string, updates: Partial<DeliveryRoute>) => void
  deleteRoute: (id: string) => void
  reGeocodeAllAddresses: () => Promise<{ success: number; failed: number; errors: string[] }>
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
  const [isGeocoding, setIsGeocoding] = useState(false)

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
    async (address: string, description = "", skipGeocodingCheck = false) => {
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

      let coordinates: { lat: number; lng: number } | undefined = undefined

      if (!skipGeocodingCheck) {
        setIsGeocoding(true)
        const geocodingResult = await geocodeAddressWithRetry(validation.corrected)
        setIsGeocoding(false)

        if (!geocodingResult.success) {
          return {
            address: null,
            geocodingFailed: true,
            attemptedAddress: validation.corrected
          }
        }

        coordinates = geocodingResult.coordinates || undefined
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
      return { address: newAddress, geocodingFailed: false }
    },
    [addresses, persistAddresses],
  )

  const addAddressWithoutGeocoding = useCallback(
    async (address: string, description = "") => {
      const result = await addAddress(address, description, true)
      if (result.address) {
        return result.address
      }
      throw new Error("Failed to add address")
    },
    [addAddress],
  )

  const addAddresses = useCallback(
    async (
      addressList: { address: string; description: string }[],
      onProgress?: (current: number, total: number, currentAddress: string, successful: number, skipped: number) => void
    ) => {
      const uniqueAddressList = removeDuplicates(addressList)

      const newAddresses: Address[] = []
      const errors: string[] = []
      const corrected: string[] = []
      const skipped: string[] = []

      setIsGeocoding(true)

      let successfulCount = 0
      let skippedCount = 0

      for (let i = 0; i < uniqueAddressList.length; i++) {
        const { address, description } = uniqueAddressList[i]

        if (onProgress) {
          onProgress(i + 1, uniqueAddressList.length, address, successfulCount, skippedCount)
        }

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

          const geocodingResult = await geocodeAddressWithRetry(validation.corrected)

          if (!geocodingResult.success) {
            skipped.push(validation.corrected)
            skippedCount++
            continue
          }

          const newAddress: Address = {
            id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            address: validation.corrected,
            description,
            dateAdded: new Date().toISOString(),
            timesUsed: 0,
            coordinates: geocodingResult.coordinates || undefined,
          }

          newAddresses.push(newAddress)
          successfulCount++
        } catch (error) {
          errors.push(`Error adding ${address}: ${error}`)
        }
      }

      setIsGeocoding(false)

      if (newAddresses.length > 0) {
        persistAddresses((prev) => [...prev, ...newAddresses])
      }

      return { added: newAddresses, errors, corrected, skipped }
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

  const reGeocodeAllAddresses = useCallback(async (): Promise<{ success: number; failed: number; errors: string[] }> => {
    // Check if Google Maps API is available
    const isReady = await waitForGoogleMaps()
    
    if (!isReady) {
      return {
        success: 0,
        failed: 0,
        errors: ["Google Maps API not loaded. Check your API key."]
      }
    }

    let successCount = 0
    let failedCount = 0
    const errorMessages: string[] = []
    const updatedAddresses: Address[] = []

    // Process each address
    for (const address of addresses) {
      // Skip if address already has valid coordinates
      if (address.coordinates && address.coordinates.lat && address.coordinates.lng) {
        updatedAddresses.push(address)
        continue
      }

      // Try to geocode the address
      try {
        const coordinates = await geocodeAddress(address.address)
        
        if (coordinates) {
          // Successfully geocoded
          updatedAddresses.push({ ...address, coordinates })
          successCount++
        } else {
          // Geocoding returned null
          updatedAddresses.push(address)
          failedCount++
          errorMessages.push(`${address.address} - geocoding failed`)
        }
      } catch (error) {
        // Exception during geocoding
        updatedAddresses.push(address)
        failedCount++
        errorMessages.push(`${address.address} - ${error instanceof Error ? error.message : 'unknown error'}`)
      }

      // Add small delay to avoid rate limits (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Batch update all addresses at once
    if (successCount > 0) {
      persistAddresses(updatedAddresses)
    }

    return {
      success: successCount,
      failed: failedCount,
      errors: errorMessages
    }
  }, [addresses, persistAddresses])

  const value = useMemo(
    () => ({
      addresses,
      routes,
      isGeocoding,
      addAddress,
      addAddressWithoutGeocoding,
      addAddresses,
      removeAddress,
      updateAddress,
      createRoute,
      updateRoute,
      deleteRoute,
      reGeocodeAllAddresses,
    }),
    [
      addAddress,
      addAddressWithoutGeocoding,
      addAddresses,
      addresses,
      isGeocoding,
      createRoute,
      deleteRoute,
      removeAddress,
      routes,
      updateAddress,
      updateRoute,
      reGeocodeAllAddresses,
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
