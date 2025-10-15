"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

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
  showRoute?: boolean
}

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

// Function to load the Google Maps script robustly
const loadScript = (apiKey: string): Promise<void> => {
  const scriptId = "google-maps-script"
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      return resolve()
    }
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existingScript) {
      const onReady = () => {
        existingScript.removeEventListener("load", onReady)
        resolve()
      }
      existingScript.addEventListener("load", onReady)
      return
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google Maps script failed to load."))
    document.head.appendChild(script)
  })
}

const MapView: React.FC<MapViewProps> = ({ stops, showRoute = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [isApiLoaded, setIsApiLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Effect to load the Google Maps API script
  useEffect(() => {
    if (!API_KEY) {
      setError("Google Maps API key is missing. Please configure it in your environment variables.")
      return
    }
    loadScript(API_KEY)
      .then(() => setIsApiLoaded(true))
      .catch(() => setError("Failed to load Google Maps. Please check your API key and internet connection."))
  }, [])

  // Effect to initialize the map instance once the API is loaded
  useEffect(() => {
    if (!isApiLoaded || !mapContainerRef.current || mapInstanceRef.current) {
      return
    }

    mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: -27.4705, lng: 153.026 }, // Default to Brisbane, AU
      zoom: 12,
      mapId: "DROPFLOW_MAP_ID",
      disableDefaultUI: true,
    })

    // Initialize DirectionsRenderer
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: false, // Show start/end markers
      preserveViewport: false, // Let it auto-fit bounds
    })
  }, [isApiLoaded])

  // Effect to show route or markers based on showRoute prop
  useEffect(() => {
    const map = mapInstanceRef.current
    const directionsRenderer = directionsRendererRef.current
    if (!map || !isApiLoaded) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const validStops = stops.filter((stop) => stop.coordinates && stop.coordinates.lat && stop.coordinates.lng)

    if (validStops.length === 0) {
      // Clear any existing route
      if (directionsRenderer) {
        directionsRenderer.setMap(null)
      }
      map.setCenter({ lat: -27.4705, lng: 153.026 })
      map.setZoom(12)
      return
    }

    if (showRoute && validStops.length >= 2) {
      // Show route using DirectionsService
      const directionsService = new window.google.maps.DirectionsService()

      // Only show pending stops in the route
      const pendingStops = validStops.filter(stop => stop.status === "pending")
      
      if (pendingStops.length >= 2) {
        const origin = pendingStops[0].coordinates!
        const destination = pendingStops[pendingStops.length - 1].coordinates!
        const waypoints = pendingStops.slice(1, -1).map(stop => ({
          location: new window.google.maps.LatLng(stop.coordinates!.lat, stop.coordinates!.lng),
          stopover: true
        }))

        directionsService.route(
          {
            origin: new window.google.maps.LatLng(origin.lat, origin.lng),
            destination: new window.google.maps.LatLng(destination.lat, destination.lng),
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
            optimizeWaypoints: false, // Keep the order as-is
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK && result) {
              if (directionsRenderer) {
                directionsRenderer.setMap(map)
                directionsRenderer.setDirections(result)
              }
            } else {
              console.error('Directions request failed:', status)
              // Fall back to showing markers
              showMarkersOnly()
            }
          }
        )
      } else {
        // Not enough pending stops for a route, show markers
        showMarkersOnly()
      }
    } else {
      // Show markers only
      if (directionsRenderer) {
        directionsRenderer.setMap(null)
      }
      showMarkersOnly()
    }

    function showMarkersOnly() {
      if (directionsRenderer) {
        directionsRenderer.setMap(null)
      }
      
      const bounds = new window.google.maps.LatLngBounds()

      validStops.forEach((stop, index) => {
        if (stop.coordinates) {
          const marker = new window.google.maps.Marker({
            position: stop.coordinates,
            map,
            title: stop.address,
            label: {
              text: `${index + 1}`,
              color: "white",
              fontWeight: "bold",
            },
          })
          markersRef.current.push(marker)
          bounds.extend(stop.coordinates)
        }
      })

      setTimeout(() => {
        google.maps.event.trigger(map, "resize")
        if (validStops.length > 0) {
          map.fitBounds(bounds, 100)
        }
      }, 100)
    }

  }, [stops, isApiLoaded, showRoute])

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-100 text-red-700 p-4 rounded-lg text-center">
        <p>{error}</p>
      </div>
    )
  }

  if (!API_KEY) {
    return (
      <div className="flex items-center justify-center h-full bg-yellow-100 text-yellow-700 p-4 rounded-lg text-center">
        <p>Google Maps API key is not configured. The map cannot be displayed.</p>
      </div>
    )
  }

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-lg overflow-hidden shadow-md bg-gray-200"
    />
  )
}

export default MapView

export { MapView }