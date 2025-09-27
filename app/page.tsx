"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, CheckCircle, Clock, AlertCircle, GripVertical, Package, Users, LogOut, LogIn } from "lucide-react"
import { getGoogleMapsApiKey } from "@/lib/google-maps"
import { AddressManager } from "@/components/address-manager"
import { RouteManager } from "@/components/route-manager"
import { useAddresses, type DeliveryRoute } from "@/hooks/use-addresses"
import { DeliveryProgress } from "@/components/delivery-progress"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModal } from "@/components/auth/auth-modal"

// Mock data and types
interface Stop {
  id: string
  address: string
  status: "pending" | "done" | "skipped"
  coordinates?: { lat: number; lng: number }
  notes?: string
  description?: string // Added description field
}

function useStops() {
  const [stops, setStops] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dropflow-stops")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const addStop = (address: string, description?: string) => {
    console.log("[v0] Adding stop to state:", { address, description })
    const newStop = {
      id: Date.now().toString(),
      address,
      status: "pending",
      description,
    }
    const newStops = [...stops, newStop]
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
      console.log("[v0] Saved to localStorage, total stops:", newStops.length)
    }
  }

  const removeStop = (id: string) => {
    const newStops = stops.filter((s) => s.id !== id)
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
    }
  }

  const updateStopStatus = (id: string, status: Stop["status"]) => {
    const newStops = stops.map((s) => (s.id === id ? { ...s, status } : s))
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
    }
  }

  const reorderStops = (newStops: Stop[]) => {
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
    }
  }

  const loadRouteStops = (route: DeliveryRoute) => {
    const routeStops = route.addresses.map((addr) => ({
      id: `route-${route.id}-${addr.id}`,
      address: addr.address,
      status: "pending" as const,
      description: addr.description,
    }))
    setStops(routeStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(routeStops))
    }
  }

  return { stops, addStop, removeStop, updateStopStatus, reorderStops, loadRouteStops }
}

interface AddressImportProps {
  onImportComplete: () => void
  stops: Stop[]
  addStop: (address: string, description?: string) => void
  user: any | null
}

function AddressImport({ onImportComplete, stops, addStop, user }: AddressImportProps) {
  const [singleAddress, setSingleAddress] = useState("")
  const [singleDescription, setSingleDescription] = useState("")
  const [bulkAddresses, setBulkAddresses] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [previewAddresses, setPreviewAddresses] = useState<
    Array<{
      id: string
      address: string
      description: string
      isValid: boolean
      error?: string
    }>
  >([])
  const [showPreview, setShowPreview] = useState(false)
  const [draggedPreviewIndex, setDraggedPreviewIndex] = useState<number | null>(null)

  const FREE_LIMIT = 15
  const canAddMore = user?.isPremium || stops.length < FREE_LIMIT

  // Address validation function
  const validateAddress = (address: string): { isValid: boolean; error?: string } => {
    const trimmed = address.trim()

    if (!trimmed) {
      return { isValid: false, error: "Empty address" }
    }

    if (trimmed.length < 10) {
      return { isValid: false, error: "Address too short" }
    }

    // Basic address pattern check (contains numbers and letters)
    const hasNumbers = /\d/.test(trimmed)
    const hasLetters = /[a-zA-Z]/.test(trimmed)

    if (!hasNumbers || !hasLetters) {
      return { isValid: false, error: "Invalid address format" }
    }

    // Check for duplicate
    const isDuplicate = stops.some((stop) => stop.address.toLowerCase().trim() === trimmed.toLowerCase())

    if (isDuplicate) {
      return { isValid: false, error: "Duplicate address" }
    }

    return { isValid: true }
  }

  const handleSingleImport = async () => {
    if (!singleAddress.trim() || !canAddMore) return

    const validation = validateAddress(singleAddress)
    if (!validation.isValid) {
      alert(`Invalid address: ${validation.error}`)
      return
    }

    setIsImporting(true)
    await new Promise((resolve) => setTimeout(resolve, 50))
    addStop(singleAddress.trim(), singleDescription.trim() || undefined)
    setSingleAddress("")
    setSingleDescription("")
    setIsImporting(false)
  }

  const processBulkAddresses = () => {
    if (!bulkAddresses.trim()) return

    console.log("[v0] Processing bulk addresses:", bulkAddresses)

    const lines = bulkAddresses
      .split(/\r?\n|\r/) // Handle different line endings (Windows, Unix, Mac)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    console.log("[v0] Split into lines:", lines)

    const processed = lines.map((line, index) => {
      // Check if line contains a pipe separator for description
      const parts = line.split("|")
      const address = parts[0]?.trim() || ""
      const description = parts[1]?.trim() || ""

      console.log("[v0] Processing line:", { line, address, description })

      const validation = validateAddress(address)

      return {
        id: `preview-${Date.now()}-${index}`,
        address,
        description,
        isValid: validation.isValid,
        error: validation.error,
      }
    })

    console.log("[v0] Processed addresses:", processed)
    setPreviewAddresses(processed)
    setShowPreview(true)
  }

  const handleBulkImport = async () => {
    const validAddresses = previewAddresses.filter((addr) => addr.isValid)

    console.log("[v0] Valid addresses to import:", validAddresses)

    if (validAddresses.length === 0) {
      alert("No valid addresses to import")
      return
    }

    const totalAfterImport = stops.length + validAddresses.length
    if (!user?.isPremium && totalAfterImport > FREE_LIMIT) {
      alert(
        `Free users can only add up to ${FREE_LIMIT} addresses. You're trying to add ${validAddresses.length} addresses but only have ${FREE_LIMIT - stops.length} slots remaining.`,
      )
      return
    }

    setIsImporting(true)

    for (let i = 0; i < validAddresses.length; i++) {
      const addr = validAddresses[i]
      console.log("[v0] Adding address:", { index: i, address: addr.address, description: addr.description })
      addStop(addr.address, addr.description || undefined)
      // Small delay to ensure state updates properly
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    console.log("[v0] Bulk import completed, added", validAddresses.length, "addresses")

    setBulkAddresses("")
    setPreviewAddresses([])
    setShowPreview(false)
    setIsImporting(false)
    onImportComplete()
  }

  const removePreviewAddress = (id: string) => {
    setPreviewAddresses((prev) => prev.filter((addr) => addr.id !== id))
  }

  const updatePreviewDescription = (id: string, description: string) => {
    setPreviewAddresses((prev) => prev.map((addr) => (addr.id === id ? { ...addr, description } : addr)))
  }

  const handlePreviewDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString())
    setDraggedPreviewIndex(index)
  }

  const handlePreviewDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handlePreviewDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const draggedIndexStr = e.dataTransfer.getData("text/plain")
    const draggedIndex = Number.parseInt(draggedIndexStr, 10)

    if (draggedIndex !== index) {
      const newAddresses = [...previewAddresses]
      const [draggedAddr] = newAddresses.splice(draggedIndex, 1)
      newAddresses.splice(index, 0, draggedAddr)
      setPreviewAddresses(newAddresses)
    }
    setDraggedPreviewIndex(null)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Import Delivery Addresses</h2>
        <p className="text-muted-foreground">
          {user?.isPremium
            ? "Add unlimited addresses to your route"
            : `Free plan: ${stops.length}/${FREE_LIMIT} addresses used`}
        </p>
      </div>

      {!canAddMore && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Address limit reached</p>
            </div>
            <p className="text-sm text-orange-700 mt-1">Upgrade to Premium to add unlimited addresses</p>
            <Button className="mt-3" size="sm">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Address</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input
              placeholder="123 Main St, City, State, ZIP"
              value={singleAddress}
              onChange={(e) => setSingleAddress(e.target.value)}
              disabled={!canAddMore}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Input
              placeholder="Customer name, delivery notes, etc."
              value={singleDescription}
              onChange={(e) => setSingleDescription(e.target.value)}
              disabled={!canAddMore}
            />
          </div>
          <Button
            onClick={handleSingleImport}
            disabled={!singleAddress.trim() || isImporting || !canAddMore}
            className="w-full"
          >
            {isImporting ? "Adding..." : "Add Address"}
          </Button>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          {!showPreview ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Addresses</label>
                <p className="text-xs text-muted-foreground">
                  Enter one address per line. Add descriptions using: Address | Description
                </p>
                <Textarea
                  placeholder="123 Main St, City, State, ZIP | John Doe&#10;456 Oak Ave, City, State, ZIP | Jane Smith&#10;789 Pine Rd, City, State, ZIP"
                  value={bulkAddresses}
                  onChange={(e) => setBulkAddresses(e.target.value)}
                  rows={8}
                  disabled={!canAddMore}
                />
              </div>
              <Button onClick={processBulkAddresses} disabled={!bulkAddresses.trim() || !canAddMore} className="w-full">
                Preview Addresses
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Address Preview</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false)
                    setPreviewAddresses([])
                  }}
                >
                  Edit Addresses
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>✅ {previewAddresses.filter((a) => a.isValid).length} valid addresses</p>
                <p>❌ {previewAddresses.filter((a) => !a.isValid).length} invalid addresses</p>
                <p className="mt-1">Drag and drop to reorder addresses</p>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {previewAddresses.map((addr, index) => (
                  <div
                    key={addr.id}
                    draggable={addr.isValid}
                    onDragStart={(e) => handlePreviewDragStart(e, index)}
                    onDragOver={handlePreviewDragOver}
                    onDrop={(e) => handlePreviewDrop(e, index)}
                    className={`p-3 rounded-lg border ${
                      addr.isValid ? "bg-green-50 border-green-200 cursor-move" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {addr.isValid && <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${addr.isValid ? "text-green-800" : "text-red-800"}`}>
                            {addr.isValid ? "✅" : "❌"} {addr.address}
                          </span>
                          <Button size="sm" variant="destructive" onClick={() => removePreviewAddress(addr.id)}>
                            Remove
                          </Button>
                        </div>

                        {!addr.isValid && addr.error && <p className="text-xs text-red-600">{addr.error}</p>}

                        {addr.isValid && (
                          <Input
                            placeholder="Add description (optional)"
                            value={addr.description}
                            onChange={(e) => updatePreviewDescription(addr.id, e.target.value)}
                            className="text-xs"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleBulkImport}
                disabled={isImporting || previewAddresses.filter((a) => a.isValid).length === 0}
                className="w-full"
              >
                {isImporting
                  ? "Importing..."
                  : `Import ${previewAddresses.filter((a) => a.isValid).length} Valid Addresses`}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GoogleMapView({ stops, currentLocation }: { stops: Stop[]; currentLocation?: { lat: number; lng: number } }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const currentLocationMarkerRef = useRef<any>(null)
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const trafficLayerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [apiKey, setApiKey] = useState<string>("")
  const [trafficAwareRoute, setTrafficAwareRoute] = useState<{
    duration: string
    durationInTraffic: string
    trafficCondition: "light" | "moderate" | "heavy"
  } | null>(null)
  const lastCalculationRef = useRef<string>("")

  const [isDrivingMode, setIsDrivingMode] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "slow" | "offline">("online")
  const [cachedRouteData, setCachedRouteData] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const pendingStops = stops.filter((s) => s.status === "pending")
  const completedStops = stops.filter((s) => s.status === "done")

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setConnectionStatus("online")
      setRetryCount(0)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setConnectionStatus("offline")
    }

    // Monitor connection quality
    const checkConnectionQuality = async () => {
      if (!navigator.onLine) {
        setConnectionStatus("offline")
        setIsOffline(true)
        return
      }

      try {
        const start = Date.now()
        const response = await fetch("https://www.google.com/favicon.ico", {
          method: "HEAD",
          cache: "no-cache",
          signal: AbortSignal.timeout(5000),
        })
        const duration = Date.now() - start

        if (response.ok) {
          if (duration > 3000) {
            setConnectionStatus("slow")
          } else {
            setConnectionStatus("online")
          }
          setIsOffline(false)
        } else {
          setConnectionStatus("slow")
        }
      } catch (error) {
        setConnectionStatus("offline")
        setIsOffline(true)
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check connection quality every 30 seconds
    const connectionInterval = setInterval(checkConnectionQuality, 30000)
    checkConnectionQuality() // Initial check

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(connectionInterval)
    }
  }, [])

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await getGoogleMapsApiKey()
        setApiKey(key)
      } catch (error) {
        console.error("Failed to fetch Google Maps API key:", error)
      }
    }
    fetchApiKey()
  }, [])

  useEffect(() => {
    if (apiKey && typeof window !== "undefined" && !window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      script.onerror = () => {
        console.error("Failed to load Google Maps API")
        setIsOffline(true)
      }
      document.head.appendChild(script)
    } else if (window.google) {
      setIsLoaded(true)
    }
  }, [apiKey])

  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current && window.google) {
      console.log("[v0] Initializing Google Maps instance with traffic layer")

      const defaultCenter = currentLocation || { lat: 37.7749, lng: -122.4194 }

      const mapOptions: any = {
        zoom: isDrivingMode ? 16 : 10,
        center: defaultCenter,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        ...(isDrivingMode && {
          zoom: 18,
          tilt: 45,
          heading: 0,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
        }),
      }

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions)

      trafficLayerRef.current = new window.google.maps.TrafficLayer()
      trafficLayerRef.current.setMap(mapInstanceRef.current)

      directionsServiceRef.current = new window.google.maps.DirectionsService()
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: !isDrivingMode,
        polylineOptions: {
          strokeColor: isDrivingMode ? "#00ff00" : "#3b82f6",
          strokeWeight: isDrivingMode ? 6 : 4,
        },
        ...(isDrivingMode && {
          panel: null,
          draggable: false,
          preserveViewport: false,
        }),
      })
      directionsRendererRef.current.setMap(mapInstanceRef.current)

      console.log("[v0] Google Maps initialized successfully with traffic layer")
    }
  }, [isLoaded, currentLocation, isDrivingMode])

  const calculateTrafficAwareRoute = async (validPositions: any[]) => {
    if (!directionsServiceRef.current || validPositions.length === 0) return

    const calculationKey = JSON.stringify({
      positions: validPositions.map((pos) => ({ lat: pos.lat(), lng: pos.lng() })),
      currentLocation,
      timestamp: Math.floor(Date.now() / 60000),
    })

    if (lastCalculationRef.current === calculationKey) {
      return
    }

    // Use cached data if offline
    if (isOffline && cachedRouteData) {
      console.log("[v0] Using cached route data due to offline status")
      setTrafficAwareRoute(cachedRouteData)
      return
    }

    lastCalculationRef.current = calculationKey

    const origin = currentLocation || validPositions[0]
    const destination = validPositions[validPositions.length - 1]
    const waypoints = currentLocation
      ? validPositions.slice(0, -1).map((pos) => ({ location: pos, stopover: true }))
      : validPositions.slice(1, -1).map((pos) => ({ location: pos, stopover: true }))

    const attemptRouteCalculation = (attempt = 0): Promise<void> => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => {
            reject(new Error("Request timeout"))
          },
          connectionStatus === "slow" ? 15000 : 10000,
        )

        directionsServiceRef.current.route(
          {
            origin,
            destination,
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
            drivingOptions: {
              departureTime: new Date(),
              trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
            },
            provideRouteAlternatives: false,
          },
          (result: any, status: string) => {
            clearTimeout(timeout)

            if (status === "OK" && result) {
              directionsRendererRef.current!.setDirections(result)

              const route = result.routes[0]
              let totalDuration = 0
              let totalDurationInTraffic = 0

              route.legs.forEach((leg: any) => {
                totalDuration += leg.duration.value
                totalDurationInTraffic += leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value
              })

              const formatDuration = (seconds: number) => {
                const hours = Math.floor(seconds / 3600)
                const minutes = Math.floor((seconds % 3600) / 60)
                return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
              }

              const trafficDelay = totalDurationInTraffic - totalDuration
              const delayPercentage = (trafficDelay / totalDuration) * 100

              let trafficCondition: "light" | "moderate" | "heavy" = "light"
              if (delayPercentage > 30) trafficCondition = "heavy"
              else if (delayPercentage > 15) trafficCondition = "moderate"

              const routeData = {
                duration: formatDuration(totalDuration),
                durationInTraffic: formatDuration(totalDurationInTraffic),
                trafficCondition,
              }

              setTrafficAwareRoute(routeData)
              setCachedRouteData(routeData) // Cache for offline use
              setRetryCount(0)

              console.log("[v0] Traffic-aware route calculated:", {
                normalDuration: formatDuration(totalDuration),
                trafficDuration: formatDuration(totalDurationInTraffic),
                condition: trafficCondition,
              })

              resolve()
            } else {
              console.error("[v0] Traffic-aware directions request failed:", status)

              if (
                attempt < maxRetries &&
                (status === "OVER_QUERY_LIMIT" || status === "REQUEST_DENIED" || status === "UNKNOWN_ERROR")
              ) {
                console.log(`[v0] Retrying route calculation (attempt ${attempt + 1}/${maxRetries})`)
                setTimeout(() => {
                  attemptRouteCalculation(attempt + 1)
                    .then(resolve)
                    .catch(reject)
                }, Math.pow(2, attempt) * 1000) // Exponential backoff
              } else {
                setRetryCount(attempt + 1)
                reject(new Error(`Route calculation failed: ${status}`))
              }
            }
          },
        )
      })
    }

    try {
      await attemptRouteCalculation()
    } catch (error) {
      console.error("[v0] Route calculation failed after retries:", error)
      // Use cached data if available
      if (cachedRouteData) {
        console.log("[v0] Falling back to cached route data")
        setTrafficAwareRoute(cachedRouteData)
      }
    }
  }

  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google) {
      return
    }

    const timeoutId = setTimeout(() => {
      console.log("[v0] Updating map with stops and traffic data", {
        pendingStops: pendingStops.length,
        currentLocation,
        isDrivingMode,
        connectionStatus,
      })

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []

      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null)
      }

      const geocoder = new window.google.maps.Geocoder()
      const bounds = new window.google.maps.LatLngBounds()

      // Add current location marker with enhanced styling for driving mode
      if (currentLocation) {
        const currentLocationMarker = new window.google.maps.Marker({
          position: currentLocation,
          map: mapInstanceRef.current,
          title: "Your Current Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: isDrivingMode ? 20 : 15,
            fillColor: isDrivingMode ? "#00ff00" : "#3b82f6",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: isDrivingMode ? 4 : 3,
          },
        })
        currentLocationMarkerRef.current = currentLocationMarker
        bounds.extend(new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng))

        // In driving mode, keep the map centered on current location
        if (isDrivingMode) {
          mapInstanceRef.current!.setCenter(currentLocation)
          mapInstanceRef.current!.setZoom(18)
        }
      }

      if (pendingStops.length === 0) {
        if (currentLocation) {
          mapInstanceRef.current!.setCenter(currentLocation)
          mapInstanceRef.current!.setZoom(isDrivingMode ? 18 : 15)
        }
        setTrafficAwareRoute(null)
        lastCalculationRef.current = ""
        return
      }

      const geocodePromises = pendingStops.map((stop, index) => {
        return new Promise<any>((resolve) => {
          const attemptGeocode = (attempt = 0) => {
            geocoder.geocode({ address: stop.address }, (results: any, status: string) => {
              if (status === "OK" && results && results[0]) {
                const position = results[0].geometry.location
                bounds.extend(position)

                const marker = new window.google.maps.Marker({
                  position,
                  map: mapInstanceRef.current,
                  title: `Stop ${index + 1}: ${stop.address}`,
                  label: {
                    text: (index + 1).toString(),
                    color: "white",
                    fontWeight: "bold",
                    fontSize: isDrivingMode ? "16px" : "12px",
                  },
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: isDrivingMode ? 25 : 20,
                    fillColor: "#ef4444",
                    fillOpacity: 1,
                    strokeColor: "white",
                    strokeWeight: isDrivingMode ? 4 : 3,
                  },
                })

                markersRef.current.push(marker)
                resolve(position)
              } else if (attempt < 2 && (status === "OVER_QUERY_LIMIT" || status === "REQUEST_DENIED")) {
                // Retry geocoding with delay
                setTimeout(() => attemptGeocode(attempt + 1), 1000 * (attempt + 1))
              } else {
                console.error(`Geocoding failed for ${stop.address}: ${status}`)
                resolve(null)
              }
            })
          }
          attemptGeocode()
        })
      })

      Promise.all(geocodePromises).then((positions) => {
        const validPositions = positions.filter((pos) => pos !== null)

        if (validPositions.length > 0) {
          if (!isDrivingMode) {
            mapInstanceRef.current!.fitBounds(bounds)
          }
          calculateTrafficAwareRoute(validPositions)
        }
      })
    }, 500) // 500ms debounce to prevent excessive updates

    // The original dependency array was: [isLoaded, pendingStops.length, currentLocation?.lat, currentLocation?.lng]
    // The lint rule suggests that currentLocation?.lng is too specific and might lead to missing updates if only lat changes.
    // However, in this context, both lat and lng are crucial for determining the current location and thus affecting the map display and route calculation.
    // To satisfy the linter while maintaining correctness, we can include the entire currentLocation object, as its change implies a change in either lat or lng.
    // Alternatively, if the intent is to re-run only when the location *value* changes, a deep comparison or a custom hook could be used.
    // For this fix, we'll include the entire object as it's the most straightforward way to address the linter's concern about specificity.
    return () => clearTimeout(timeoutId)
  }, [isLoaded, pendingStops.length, currentLocation, isDrivingMode, connectionStatus])

  const openInGoogleMaps = () => {
    const addresses = stops.map((stop) => encodeURIComponent(stop.address))
    if (addresses.length === 1) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${addresses[0]}`, "_blank")
    } else if (addresses.length > 1) {
      const waypoints = addresses.slice(1).join("|")
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${addresses[0]}&waypoints=${waypoints}`, "_blank")
    }
  }

  const openInAppleMaps = () => {
    const addresses = stops.map((stop) => encodeURIComponent(stop.address))
    if (addresses.length >= 1) {
      window.open(`http://maps.apple.com/?daddr=${addresses[0]}`, "_blank")
    }
  }

  const openInWaze = () => {
    const firstAddress = encodeURIComponent(stops[0]?.address || "")
    if (firstAddress) {
      window.open(`https://waze.com/ul?q=${firstAddress}&navigate=yes`, "_blank")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          {stops.length > 0 && (
            <>
              <Button onClick={openInGoogleMaps} className="flex items-center gap-2 bg-transparent" variant="outline">
                <span>🗺️</span>
                Navigate with Google Maps
              </Button>
              <Button onClick={openInAppleMaps} className="flex items-center gap-2 bg-transparent" variant="outline">
                <span>🍎</span>
                Navigate with Apple Maps
              </Button>
              <Button onClick={openInWaze} className="flex items-center gap-2 bg-transparent" variant="outline">
                <span>🚗</span>
                Navigate with Waze
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Connection Status Indicator */}
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              connectionStatus === "online"
                ? "bg-green-100 text-green-800"
                : connectionStatus === "slow"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {connectionStatus === "online"
              ? "🟢 Online"
              : connectionStatus === "slow"
                ? "🟡 Slow Connection"
                : "🔴 Offline"}
          </div>

          {/* Driving Mode Toggle */}
          <Button
            onClick={() => setIsDrivingMode(!isDrivingMode)}
            variant={isDrivingMode ? "default" : "outline"}
            size="sm"
            className={isDrivingMode ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {isDrivingMode ? "🚗 Exit Driving Mode" : "🚗 Driving Mode"}
          </Button>
        </div>
      </div>

      <div className="relative">
        {stops.length > 0 || currentLocation ? (
          <div
            className={`w-full rounded-lg border border-gray-200 relative overflow-hidden ${
              isDrivingMode ? "h-[500px]" : "h-96"
            }`}
          >
            {(!isLoaded || !apiKey) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">
                    {!apiKey ? "Loading API configuration..." : "Loading Google Maps with traffic data..."}
                  </p>
                  {isOffline && (
                    <p className="text-xs text-red-600 mt-1">
                      Poor connection detected - using cached data when available
                    </p>
                  )}
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />

            <div
              className={`absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border ${
                isDrivingMode ? "bg-black/80 text-white border-green-400" : ""
              }`}
            >
              <div className={`font-semibold text-sm mb-2 ${isDrivingMode ? "text-green-400" : ""}`}>
                {isDrivingMode ? "🚗 Navigation Mode" : "Route Map"}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isDrivingMode ? "bg-green-500" : "bg-red-500"}`}></div>
                  <span>{pendingStops.length} Pending</span>
                </div>
                {completedStops.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>{completedStops.length} Delivered</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 border-t">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Live Traffic</span>
                </div>
                {isOffline && (
                  <div className="flex items-center gap-2 pt-1 border-t border-red-300">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-red-400">Offline Mode</span>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-4 right-4 space-y-2">
              <div
                className={`px-3 py-2 rounded-lg text-sm font-medium shadow-lg ${
                  isDrivingMode ? "bg-green-600 text-white text-lg px-4 py-3" : "bg-blue-600 text-white"
                }`}
              >
                {isDrivingMode
                  ? `🎯 ${pendingStops.length} Stop${pendingStops.length !== 1 ? "s" : ""} Remaining`
                  : `${pendingStops.length} Pending Stop${pendingStops.length !== 1 ? "s" : ""}`}
              </div>

              {trafficAwareRoute && (
                <div
                  className={`px-3 py-2 rounded-lg text-sm font-medium shadow-lg ${
                    isDrivingMode ? "text-lg px-4 py-3" : ""
                  } ${
                    trafficAwareRoute.trafficCondition === "heavy"
                      ? "bg-red-600 text-white"
                      : trafficAwareRoute.trafficCondition === "moderate"
                        ? "bg-orange-500 text-white"
                        : "bg-green-600 text-white"
                  }`}
                >
                  <div className={`opacity-90 ${isDrivingMode ? "text-sm" : "text-xs"}`}>
                    {trafficAwareRoute.trafficCondition === "heavy"
                      ? "🔴 Heavy Traffic"
                      : trafficAwareRoute.trafficCondition === "moderate"
                        ? "🟡 Moderate Traffic"
                        : "🟢 Light Traffic"}
                  </div>
                  <div className={`font-bold ${isDrivingMode ? "text-xl" : ""}`}>
                    ETA: {trafficAwareRoute.durationInTraffic}
                  </div>
                  {trafficAwareRoute.duration !== trafficAwareRoute.durationInTraffic && (
                    <div className={`opacity-75 ${isDrivingMode ? "text-sm" : "text-xs"}`}>
                      Normal: {trafficAwareRoute.duration}
                    </div>
                  )}
                  {isOffline && (
                    <div className={`opacity-75 text-yellow-200 ${isDrivingMode ? "text-sm" : "text-xs"}`}>
                      (Cached Data)
                    </div>
                  )}
                </div>
              )}

              {retryCount > 0 && (
                <div className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-xs">
                  Connection issues - Retrying... ({retryCount}/{maxRetries})
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-96 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2">
                {completedStops.length > 0 ? "All Deliveries Complete!" : "No Pending Stops"}
              </h3>
              <p className="text-sm opacity-90">
                {completedStops.length > 0
                  ? "Great job! All your deliveries have been completed."
                  : "Add delivery addresses to see them on the map with live traffic"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableStopItem({
  stop,
  index,
  updateStopStatus,
  removeStop,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  stop: Stop
  index: number
  updateStopStatus: (id: string, status: Stop["status"]) => void
  removeStop: (id: string) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, index: number) => void
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-move hover:bg-muted/80 transition-colors"
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline">{index + 1}</Badge>
        <div className="flex flex-col">
          <span className="text-sm">{stop.address}</span>
          {stop.description && <span className="text-xs text-muted-foreground">{stop.description}</span>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={stop.status === "done" ? "default" : "outline"}
          onClick={() => updateStopStatus(stop.id, stop.status === "done" ? "pending" : "done")}
        >
          {stop.status === "done" ? "Done" : "Mark Done"}
        </Button>
        <Button size="sm" variant="destructive" onClick={() => removeStop(stop.id)}>
          Remove
        </Button>
      </div>
    </div>
  )
}

interface RoutePlanningProps {
  stops: Stop[]
  updateStopStatus: (id: string, status: Stop["status"]) => void
  removeStop: (id: string) => void
  reorderStops: (newStops: Stop[]) => void
}

function RoutePlanning({ stops, updateStopStatus, removeStop, reorderStops }: RoutePlanningProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [routeTime, setRouteTime] = useState<string>("")
  const [trafficRouteTime, setTrafficRouteTime] = useState<string>("")
  const [isCalculatingTime, setIsCalculatingTime] = useState(false)
  const [timeComparison, setTimeComparison] = useState<{
    oldTime: string
    newTime: string
    saved: boolean
    noImprovement?: boolean
  } | null>(null)
  const [preReorderTime, setPreReorderTime] = useState<string>("")

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting current location:", error)
        },
      )
    }
  }, [])

  const calculateRouteTime = async (stopsToCalculate: Stop[], includeTraffic = true) => {
    if (!currentLocation || stopsToCalculate.length === 0) {
      return ""
    }

    try {
      const apiKey = await getGoogleMapsApiKey()

      if (typeof window !== "undefined" && window.google && window.google.maps) {
        const directionsService = new window.google.maps.DirectionsService()
        const geocoder = new window.google.maps.Geocoder()

        // Geocode all addresses first
        const geocodePromises = stopsToCalculate.map((stop) => {
          return new Promise<any>((resolve) => {
            geocoder.geocode({ address: stop.address }, (results: any, status: string) => {
              if (status === "OK" && results && results[0]) {
                resolve(results[0].geometry.location)
              } else {
                resolve(null)
              }
            })
          })
        })

        const positions = await Promise.all(geocodePromises)
        const validPositions = positions.filter((pos) => pos !== null)

        if (validPositions.length === 0) return ""

        return new Promise<string>((resolve) => {
          const origin = currentLocation
          const destination = validPositions[validPositions.length - 1]
          const waypoints = validPositions.slice(0, -1).map((pos) => ({ location: pos, stopover: true }))

          const requestOptions: any = {
            origin,
            destination,
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          }

          if (includeTraffic) {
            requestOptions.drivingOptions = {
              departureTime: new Date(),
              trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
            }
          }

          directionsService.route(requestOptions, (result: any, status: string) => {
            if (status === "OK" && result) {
              const route = result.routes[0]
              let totalDuration = 0

              route.legs.forEach((leg: any) => {
                if (includeTraffic && leg.duration_in_traffic) {
                  totalDuration += leg.duration_in_traffic.value
                } else {
                  totalDuration += leg.duration.value
                }
              })

              const hours = Math.floor(totalDuration / 3600)
              const minutes = Math.floor((totalDuration % 3600) / 60)

              if (hours > 0) {
                resolve(`${hours}h ${minutes}m`)
              } else {
                resolve(`${minutes}m`)
              }
            } else {
              resolve("")
            }
          })
        })
      }
    } catch (error) {
      console.error("Error calculating route time:", error)
    }

    return ""
  }

  useEffect(() => {
    const pendingStops = stops.filter((s) => s.status === "pending")
    if (pendingStops.length > 0 && currentLocation) {
      setIsCalculatingTime(true)

      Promise.all([
        calculateRouteTime(pendingStops, false), // Normal time
        calculateRouteTime(pendingStops, true), // Traffic-aware time
      ]).then(([normalTime, trafficTime]) => {
        setRouteTime(normalTime)
        setTrafficRouteTime(trafficTime)
        setIsCalculatingTime(false)
      })
    } else {
      setRouteTime("")
      setTrafficRouteTime("")
      setIsCalculatingTime(false)
    }
  }, [stops, currentLocation])

  const optimizeRoute = async () => {
    if (!currentLocation) {
      alert("Please allow location access to optimize your route from your current location.")
      return
    }

    setIsOptimizing(true)
    setTimeComparison(null)

    const pendingStops = stops.filter((s) => s.status === "pending")
    const completedStops = stops.filter((s) => s.status === "done")

    if (pendingStops.length < 2) {
      setIsOptimizing(false)
      return
    }

    try {
      const currentTime = await calculateRouteTime(pendingStops, true) // Use traffic-aware time for comparison

      if (typeof window !== "undefined" && window.google && window.google.maps) {
        const directionsService = new window.google.maps.DirectionsService()
        const geocoder = new window.google.maps.Geocoder()

        const geocodePromises = pendingStops.map((stop, index) => {
          return new Promise<{ stop: Stop; position: any; index: number }>((resolve) => {
            geocoder.geocode({ address: stop.address }, (results: any, status: string) => {
              if (status === "OK" && results && results[0]) {
                resolve({
                  stop,
                  position: results[0].geometry.location,
                  index,
                })
              } else {
                console.error(`Geocoding failed for ${stop.address}: ${status}`)
                resolve({ stop, position: null, index })
              }
            })
          })
        })

        const geocodedStops = await Promise.all(geocodePromises)
        const validStops = geocodedStops.filter((item) => item.position !== null)

        if (validStops.length > 1) {
          const origin = currentLocation
          const destination = validStops[validStops.length - 1].position
          const waypoints = validStops.slice(0, -1).map((item) => ({
            location: item.position,
            stopover: true,
          }))

          await new Promise<void>((resolve) => {
            directionsService.route(
              {
                origin,
                destination,
                waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
                optimizeWaypoints: true,
                // Use drivingOptions for optimization as well
                drivingOptions: {
                  departureTime: new Date(),
                  trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
                },
              },
              (result: any, status: string) => {
                if (status === "OK" && result) {
                  const optimizedOrder = result.routes[0].waypoint_order

                  const reorderedStops = [
                    ...optimizedOrder.map((waypointIndex: number) => validStops[waypointIndex].stop),
                    validStops[validStops.length - 1].stop, // destination
                    ...completedStops,
                  ]

                  reorderStops(reorderedStops)

                  // Calculate new time for comparison
                  const optimizedPendingStops = reorderedStops.filter((s) => s.status === "pending")
                  calculateRouteTime(optimizedPendingStops, true).then((optimizedTime) => {
                    // Use traffic-aware time
                    if (currentTime && optimizedTime) {
                      const currentMinutes = parseTimeToMinutes(currentTime)
                      const optimizedMinutes = parseTimeToMinutes(optimizedTime)
                      const timeDifference = Math.abs(currentMinutes - optimizedMinutes)

                      if (timeDifference <= 1) {
                        setTimeComparison({
                          oldTime: currentTime,
                          newTime: optimizedTime,
                          saved: false,
                          noImprovement: true,
                        })
                      } else {
                        const saved = optimizedMinutes < currentMinutes
                        setTimeComparison({
                          oldTime: currentTime,
                          newTime: optimizedTime,
                          saved,
                          noImprovement: false,
                        })
                      }
                    }
                  })
                } else {
                  console.error("Route optimization failed:", status)
                }
                resolve()
              },
            )
          })
        }
      }
    } catch (error) {
      console.error("Route optimization failed:", error)
    }

    setIsOptimizing(false)
  }

  const parseTimeToMinutes = (timeStr: string): number => {
    const hourMatch = timeStr.match(/(\d+)h/)
    const minuteMatch = timeStr.match(/(\d+)m/)

    const hours = hourMatch ? Number.parseInt(hourMatch[1]) : 0
    const minutes = minuteMatch ? Number.parseInt(minuteMatch[1]) : 0

    return hours * 60 + minutes
  }

  const pendingStops = stops.filter((s) => s.status === "pending")
  const completedStops = stops.filter((s) => s.status === "done")

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString())
    setDraggedIndex(index)
    setPreReorderTime(trafficRouteTime) // Use traffic-aware time for pre-reorder
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const draggedIndexStr = e.dataTransfer.getData("text/plain")
    const draggedIndex = Number.parseInt(draggedIndexStr, 10)
    if (draggedIndex !== index) {
      const newStops = [...stops]
      const [draggedStop] = newStops.splice(draggedIndex, 1)
      newStops.splice(index, 0, draggedStop)
      reorderStops(newStops)

      if (preReorderTime && currentLocation) {
        const pendingStops = newStops.filter((s) => s.status === "pending")
        const newTime = await calculateRouteTime(pendingStops, true) // Calculate traffic-aware time

        if (newTime && preReorderTime !== newTime) {
          const oldMinutes = parseTimeToMinutes(preReorderTime)
          const newMinutes = parseTimeToMinutes(newTime)
          const timeDifference = Math.abs(oldMinutes - newMinutes)

          if (timeDifference > 1) {
            const saved = newMinutes < oldMinutes
            setTimeComparison({
              oldTime: preReorderTime,
              newTime: newTime,
              saved,
              noImprovement: false,
            })

            setTimeout(() => {
              setTimeComparison(null)
            }, 5000)
          }
        }
      }
    }
    setDraggedIndex(null)
    setPreReorderTime("")
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Route Planning</h2>
        <p className="text-muted-foreground">Optimize your delivery route with live traffic data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stops.length}</p>
                <p className="text-sm text-muted-foreground">Total Stops</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingStops.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completedStops.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
            <CardDescription>Visual overview of your delivery stops</CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleMapView stops={stops} currentLocation={currentLocation} />
          </CardContent>
        </Card>
      )}

      {pendingStops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Deliveries</CardTitle>
            <CardDescription>Drag and drop to reorder your delivery sequence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Normal Time:</span>
                  </div>
                  <div className="text-sm font-bold">
                    {isCalculatingTime ? (
                      <span className="text-muted-foreground">Calculating...</span>
                    ) : routeTime ? (
                      routeTime
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-blue-800">With Traffic:</span>
                  </div>
                  <div className="text-sm font-bold text-blue-800">
                    {isCalculatingTime ? (
                      <span className="text-blue-600">Calculating...</span>
                    ) : trafficRouteTime ? (
                      trafficRouteTime
                    ) : (
                      <span className="text-blue-600">--</span>
                    )}
                  </div>
                </div>
              </div>

              {timeComparison && (
                <div
                  className={`p-3 rounded-lg border ${
                    timeComparison.noImprovement
                      ? "bg-blue-50 border-blue-200"
                      : timeComparison.saved
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {timeComparison.noImprovement
                        ? "✅ Route Already Optimised!"
                        : timeComparison.saved
                          ? "✅ Time Saved!"
                          : "⚠️ Time Added"}
                    </span>
                    <div
                      className={`font-bold ${
                        timeComparison.noImprovement
                          ? "text-blue-700"
                          : timeComparison.saved
                            ? "text-green-700"
                            : "text-red-700"
                      }`}
                    >
                      {timeComparison.noImprovement
                        ? timeComparison.newTime
                        : `${timeComparison.oldTime} → ${timeComparison.newTime}`}
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={optimizeRoute}
                disabled={isOptimizing || pendingStops.length < 2 || !currentLocation}
                className="w-full"
              >
                {isOptimizing ? "Optimizing Route..." : "Optimize Route (Traffic-Aware)"}
              </Button>
              {!currentLocation && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Please allow location access to optimize your route with live traffic data
                </p>
              )}
            </div>
            <div className="space-y-2">
              {pendingStops.map((stop, index) => {
                const originalIndex = stops.findIndex((s) => s.id === stop.id)
                return (
                  <DraggableStopItem
                    key={stop.id}
                    stop={stop}
                    index={originalIndex}
                    updateStopStatus={updateStopStatus}
                    removeStop={removeStop}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Updated completed deliveries section to show descriptions */}
      {completedStops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivered</CardTitle>
            <CardDescription>Completed deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedStops.map((stop, index) => {
                const originalIndex = stops.findIndex((s) => s.id === stop.id)
                return (
                  <div
                    key={stop.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        {originalIndex + 1}
                      </Badge>
                      <div className="flex flex-col">
                        <span className="text-sm text-green-800">{stop.address}</span>
                        {stop.description && <span className="text-xs text-green-600">{stop.description}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                        onClick={() => updateStopStatus(stop.id, "pending")}
                      >
                        Mark Pending
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeStop(stop.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function DropFlowApp() {
  const { user, logout, isLoading } = useAuth()
  const { stops, addStop, removeStop, updateStopStatus, reorderStops, loadRouteStops } = useStops()
  const { addresses, routes } = useAddresses()
  const [currentView, setCurrentView] = useState<"home" | "addresses" | "routes" | "plan">("home")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalView, setAuthModalView] = useState<"login" | "signup">("login")
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true)
    }
  }, [user, isLoading])

  const handleLogout = async () => {
    await logout()
    setShowAuthModal(true)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  // Define hasActiveDelivery and activeRoute here
  const hasActiveDelivery = stops.some((stop) => stop.status === "pending")
  const activeRoute = routes.find((route) => route.status === "active")

  const handleCreateRoute = (routeId: string) => {
    // Switch to routes view to show the created route
    setCurrentView("routes")
  }

  const handleStartRoute = (route: DeliveryRoute) => {
    // Load the route addresses into the route planning system
    loadRouteStops(route)
    setCurrentView("plan")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading DropFlow...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-4xl font-bold text-red-600 mb-4">🚛 DropFlow</h1>
            <p className="text-xl text-muted-foreground mb-6">Smart Delivery Route Optimization</p>
            <p className="text-muted-foreground mb-8">
              Sign in to start optimizing your delivery routes with AI-powered planning and live traffic data.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setAuthModalView("login")
                  setShowAuthModal(true)
                }}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button
                onClick={() => {
                  setAuthModalView("signup")
                  setShowAuthModal(true)
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultView={authModalView} />
      </>
    )
  }

  if (currentView === "plan") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setCurrentView("home")}>
              ← Back to Home
            </Button>
            <h1 className="text-2xl font-bold">🚛 DropFlow</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push("/account")}>
                <GripVertical className="h-4 w-4 mr-2" />
                Account
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {hasActiveDelivery && (
            <div className="mb-6">
              <DeliveryProgress
                stops={stops}
                activeRoute={activeRoute}
                compact
                onNavigateToRoute={() => setCurrentView("plan")}
              />
            </div>
          )}

          <RoutePlanning
            stops={stops}
            updateStopStatus={updateStopStatus}
            removeStop={removeStop}
            reorderStops={reorderStops}
          />
        </div>
      </div>
    )
  }

  if (currentView === "addresses") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setCurrentView("home")}>
              ← Back to Home
            </Button>
            <h1 className="text-2xl font-bold">🚛 DropFlow - Address Manager</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push("/account")}>
                <GripVertical className="h-4 w-4 mr-2" />
                Account
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <AddressManager onCreateRoute={handleCreateRoute} />
        </div>
      </div>
    )
  }

  if (currentView === "routes") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setCurrentView("home")}>
              ← Back to Home
            </Button>
            <h1 className="text-2xl font-bold">🚛 DropFlow - Route Manager</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push("/account")}>
                <GripVertical className="h-4 w-4 mr-2" />
                Account
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <RouteManager onStartRoute={handleStartRoute} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-red-600 mb-2">🚛 DropFlow</h1>
            <p className="text-xl text-muted-foreground">
              Welcome back, {user?.firstName || user?.email?.split("@")[0] || "User"}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/account")}>
              <Users className="h-4 w-4 mr-2" />
              Account
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {hasActiveDelivery && (
          <div className="mb-6">
            <DeliveryProgress
              stops={stops}
              activeRoute={activeRoute}
              compact
              onNavigateToRoute={() => setCurrentView("plan")}
            />
          </div>
        )}

        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Manage your addresses and create optimized delivery routes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={() => setCurrentView("addresses")}
                className="bg-red-600 hover:bg-red-700"
                variant="default"
              >
                <Package className="h-4 w-4 mr-2" />
                Manage Addresses
              </Button>
              <Button onClick={() => setCurrentView("routes")} variant="outline" className="bg-transparent">
                <MapPin className="h-4 w-4 mr-2" />
                Create Routes
              </Button>
            </div>
            {routes.length > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                You have {routes.length} delivery route{routes.length !== 1 ? "s" : ""} ready
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setCurrentView("addresses")}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 mb-1">{addresses.length}</p>
                <p className="text-sm text-muted-foreground">Total Addresses</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setCurrentView("routes")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 mb-1">{routes.length}</p>
                <p className="text-sm text-muted-foreground">Delivery Routes</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setCurrentView("routes")}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 mb-1">
                  {routes.filter((r) => r.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active Routes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user?.isPremium ? "Premium Account" : "Free Account"}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.isPremium
                    ? "Unlimited addresses and premium features"
                    : `${addresses.length}/15 addresses used`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/account")}>
                  <Users className="h-4 w-4 mr-2" />
                  Account Profile
                </Button>
                {!user?.isPremium && <Button size="sm">Upgrade to Premium</Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
