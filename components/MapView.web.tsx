"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"

// Stop interface based on what's passed from route-planner
interface Stop {
  id: string
  address: string
  status: "pending" | "done" | "skipped"
  coordinates?: { lat: number; lng: number }
  description?: string
}

interface MapViewProps {
  stops: Stop[]
}

const API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY

const MapView: React.FC<MapViewProps> = ({ stops }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null)
  const [isApiLoaded, setIsApiLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [stopOrder, setStopOrder] = useState<number[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  const pendingStops = useMemo(
    () =>
      stops.filter(
        (stop) =>
          stop.status === "pending" && stop.coordinates && stop.coordinates.lat && stop.coordinates.lng,
      ),
    [stops],
  )

  // Effect to wait for Google Maps API (loaded globally by GoogleMapsScriptLoader)
  useEffect(() => {
    if (!API_KEY) {
      setIsApiLoaded(false)
      setError(
        "Google Maps API key not configured. Please set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to display the map.",
      )
      return
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsApiLoaded(true)
      return
    }
    
    // Poll for Google Maps API availability (loaded by GoogleMapsScriptLoader)
    const checkInterval = setInterval(() => {
      if (window.google?.maps) {
        setIsApiLoaded(true)
        clearInterval(checkInterval)
      }
    }, 100) // Check every 100ms
    
    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkInterval)
      if (!window.google?.maps) {
        setError("Failed to load Google Maps. Please check your API key and internet connection.")
      }
    }, 10000)
    
    return () => {
      clearInterval(checkInterval)
      clearTimeout(timeout)
    }
  }, [])

  // Effect to initialize the map instance once the API is loaded
  useEffect(() => {
    if (!API_KEY || !isApiLoaded || !mapContainerRef.current || mapInstanceRef.current) {
      return
    }

    mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: -27.4705, lng: 153.026 }, // Default to Brisbane, AU
      zoom: 12,
      mapId: "DROPFLOW_MAP_ID",
      disableDefaultUI: true,
    })
  }, [isApiLoaded])

  useEffect(() => {
    setStopOrder(pendingStops.map((_, index) => index))
  }, [pendingStops])

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
      },
      (geoError) => {
        console.warn("Unable to retrieve current position", geoError)
      },
      { enableHighAccuracy: true },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Effect to update markers and map bounds when stops change
  useEffect(() => {
    if (!API_KEY) return

    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers from the map and the ref
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null)
      currentLocationMarkerRef.current = null
    }

    if (pendingStops.length === 0) {
      const fallbackCenter = currentLocation || { lat: -27.4705, lng: 153.026 }
      map.setCenter(fallbackCenter)
      map.setZoom(currentLocation ? 14 : 12)

      if (currentLocation) {
        currentLocationMarkerRef.current = new window.google.maps.Marker({
          position: currentLocation,
          map,
          title: "Current Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#34A853",
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
          },
        })
      }

      return
    }

    const bounds = new window.google.maps.LatLngBounds()

    pendingStops.forEach((stop, index) => {
      if (stop.coordinates) {
        const orderPosition = stopOrder.indexOf(index)
        const marker = new window.google.maps.Marker({
          position: stop.coordinates,
          map,
          title: stop.address,
          label: {
            text: `${orderPosition >= 0 ? orderPosition + 1 : index + 1}`,
            color: "white",
            fontWeight: "bold",
          },
        })
        markersRef.current.push(marker)
        bounds.extend(stop.coordinates)
      }
    })

    if (currentLocation) {
      currentLocationMarkerRef.current = new window.google.maps.Marker({
        position: currentLocation,
        map,
        title: "Current Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#34A853",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
      })
      bounds.extend(currentLocation)
    }

    // This is the key fix for the "blue map" issue.
    // We trigger a resize event and then fit the bounds.
    setTimeout(() => {
      google.maps.event.trigger(map, "resize")
      if (pendingStops.length > 0 || currentLocation) {
        map.fitBounds(bounds, 100) // 100px padding
      }
    }, 100) // A small delay ensures the container has its final size.

  }, [isApiLoaded, stopOrder, pendingStops, currentLocation])

  // Effect to render optimized route whenever stops change
  useEffect(() => {
    if (!API_KEY) {
      return
    }

    const map = mapInstanceRef.current

    // Guard checks
    if (!isApiLoaded || !map) {
      // Clean up any existing renderer if the map isn't ready
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      // Reset route error until we can attempt again
      setRouteError(null)
      return
    }

    // Filter stops with valid coordinates
    if (pendingStops.length === 0) {
      setRouteError("All pending deliveries have been completed or skipped. No route to display.")
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      return
    }

    if (pendingStops.length === 1 && !currentLocation) {
      setRouteError(
        "Cannot display route: Need your current location or at least two pending stops with GPS coordinates.",
      )
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      return
    }

    // Clear error if we have valid stops
    setRouteError(null)

    // Initialize DirectionsService if not exists
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new window.google.maps.DirectionsService()
    }

    // Build DirectionsRequest
    const origin = currentLocation || pendingStops[0].coordinates!
    const destination =
      pendingStops.length === 1 ? pendingStops[0].coordinates! : pendingStops[pendingStops.length - 1].coordinates!

    const intermediateStops = (() => {
      if (pendingStops.length <= 1) {
        return []
      }

      if (currentLocation) {
        return pendingStops.slice(0, -1)
      }

      return pendingStops.slice(1, -1)
    })()

    const waypoints = intermediateStops.map((stop) => ({
      location: stop.coordinates!,
      stopover: true,
    }))

    const request: google.maps.DirectionsRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: waypoints.length > 0,
    }

    // Call DirectionsService
    directionsServiceRef.current.route(request, (result, status) => {
      if (status === window.google.maps.DirectionsStatus.OK && result) {
        // Clear existing DirectionsRenderer
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null)
        }

        // Create new DirectionsRenderer
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map,
          directions: result,
          suppressMarkers: true, // Keep our custom numbered markers
          polylineOptions: {
            strokeColor: '#4285F4', // Google blue
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        })
        // Clear any route errors on success
        setRouteError(null)

        const waypointOrder = result.routes?.[0]?.waypoint_order
        if (waypointOrder && intermediateStops.length > 0) {
          if (currentLocation) {
            const optimizedOrder = [
              ...waypointOrder.map((wpIndex) => wpIndex),
              pendingStops.length === 1 ? 0 : pendingStops.length - 1,
            ]
            setStopOrder(Array.from(new Set(optimizedOrder)))
          } else {
            const optimizedOrder = [
              0,
              ...waypointOrder.map((wpIndex) => wpIndex + 1),
              pendingStops.length - 1,
            ]
            setStopOrder(Array.from(new Set(optimizedOrder)))
          }
        } else {
          setStopOrder(pendingStops.map((_, index) => index))
        }
      } else {
        // Set error message for DirectionsService failures
        setRouteError(`Unable to calculate route: ${status}. Please check your addresses and try again.`)
        console.error('DirectionsService failed with status:', status)
      }
    })

    // Cleanup function
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
    }
  }, [isApiLoaded, pendingStops, currentLocation])

  useEffect(() => {
    if (!API_KEY || !isApiLoaded) {
      return
    }

    const map = mapInstanceRef.current
    if (!map) return

    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new window.google.maps.TrafficLayer()
    }

    trafficLayerRef.current.setMap(map)

    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null)
      }
    }
  }, [isApiLoaded])

  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current = []

      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null)
        currentLocationMarkerRef.current = null
      }

      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }

      directionsServiceRef.current = null
      mapInstanceRef.current = null
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null)
        trafficLayerRef.current = null
      }
    }
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-100 text-red-700 p-4 rounded-lg text-center">
        <p>{error}</p>
      </div>
    )
  }

  if (!API_KEY) {
    return (
      <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md bg-gray-200">
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-lg rounded-lg border border-yellow-300 bg-yellow-50 p-6 text-yellow-800 shadow">
            <h3 className="text-lg font-semibold mb-2">Google Maps unavailable</h3>
            <p className="text-sm">
              Set the <code>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY</code> environment variable to enable live Google Maps routing and visualisation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg overflow-hidden shadow-md bg-gray-200"
    >
      {/* Route Error Overlay */}
      {routeError && (
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none z-10">
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 max-w-md shadow-lg pointer-events-auto">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">Route Display Issue</h3>
                <p className="text-sm text-yellow-700 mb-3">{routeError}</p>
                <p className="text-xs text-yellow-600">
                  Tip: Ensure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is configured in your environment variables.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView

export { MapView }