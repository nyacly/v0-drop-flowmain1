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
    // If script is already loaded or is in the process of loading, wait for it
    if (window.google && window.google.maps) {
      return resolve()
    }

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existingScript) {
      const onReady = () => {
        existingScript.removeEventListener("load", onReady)
        existingScript.removeEventListener("error", onError)
        resolve()
      }
      const onError = (e: Event | string) => {
        existingScript.removeEventListener("load", onReady)
        existingScript.removeEventListener("error", onError)
        reject(e)
      }
      existingScript.addEventListener("load", onReady)
      existingScript.addEventListener("error", onError)
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
  const mapRef = useRef<HTMLDivElement>(null)
  const [isApiLoaded, setIsApiLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!API_KEY) {
      setError("Google Maps API key is missing. Please configure it in your environment variables.")
      return
    }

    loadScript(API_KEY)
      .then(() => setIsApiLoaded(true))
      .catch(() => setError("Failed to load Google Maps. Please check your API key and internet connection."))
  }, [])

  useEffect(() => {
    if (!isApiLoaded || !mapRef.current) return

    const validStops = stops.filter((stop) => stop.coordinates && stop.coordinates.lat && stop.coordinates.lng)

    if (validStops.length === 0) {
      // Default view if no stops have coordinates
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: -27.4705, lng: 153.026 }, // Brisbane, AU
        zoom: 12,
        mapId: "DROPFLOW_MAP_ID",
      })
      return
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: validStops[0].coordinates,
      zoom: 14,
      mapId: "DROPFLOW_MAP_ID",
    })

    const bounds = new window.google.maps.LatLngBounds()

    validStops.forEach((stop, index) => {
      if (stop.coordinates) {
        new window.google.maps.Marker({
          position: stop.coordinates,
          map,
          title: stop.address,
          label: {
            text: `${index + 1}`,
            color: "white",
          },
        })
        bounds.extend(stop.coordinates)
      }
    })

    if (validStops.length > 1) {
      map.fitBounds(bounds)
    } else {
      map.setCenter(bounds.getCenter())
      map.setZoom(14)
    }
  }, [isApiLoaded, stops])

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8d7da', color: '#721c24', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
        <p>{error}</p>
      </div>
    )
  }

  if (!API_KEY) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#fff3cd', color: '#856404', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
        <p>Google Maps API key is not configured. The map cannot be displayed.</p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        background: "#e9e9e9", // Placeholder while map loads
      }}
    />
  )
}

export default MapView