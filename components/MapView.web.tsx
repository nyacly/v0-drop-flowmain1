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

const MapView: React.FC<MapViewProps> = ({ stops }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
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
  }, [isApiLoaded])

  // Effect to update markers and map bounds when stops change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers from the map and the ref
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const validStops = stops.filter((stop) => stop.coordinates && stop.coordinates.lat && stop.coordinates.lng)

    if (validStops.length === 0) {
      map.setCenter({ lat: -27.4705, lng: 153.026 })
      map.setZoom(12)
      return
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

    // This is the key fix for the "blue map" issue.
    // We trigger a resize event and then fit the bounds.
    setTimeout(() => {
      google.maps.event.trigger(map, "resize")
      if (validStops.length > 0) {
        map.fitBounds(bounds, 100) // 100px padding
      }
    }, 100) // A small delay ensures the container has its final size.

  }, [stops, isApiLoaded])

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