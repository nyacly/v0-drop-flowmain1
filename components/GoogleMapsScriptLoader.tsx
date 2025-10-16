"use client"

import { useEffect } from "react"

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,directions`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google Maps script failed to load."))
    document.head.appendChild(script)
  })
}

export default function GoogleMapsScriptLoader() {
  useEffect(() => {
    if (!API_KEY) {
      console.warn("Google Maps API key missing. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in environment variables.")
      return
    }

    loadScript(API_KEY)
      .then(() => {
        console.log("Google Maps script loaded successfully")
      })
      .catch((error) => {
        console.error("Failed to load Google Maps script:", error)
      })
  }, [])

  return null // Silent loader - no UI rendering
}
