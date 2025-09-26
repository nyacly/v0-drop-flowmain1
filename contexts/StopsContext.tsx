"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Stop } from "../types/route"

interface StopsContextType {
  stops: Stop[]
  setStops: (stops: Stop[]) => void
  updateStops: (stops: Stop[]) => void
  updateStop: (updatedStop: Stop) => void
  addStop: (stop: Stop) => void
  removeStop: (stopId: string) => void
  clearStops: () => void
  isLoading: boolean
}

const StopsContext = createContext<StopsContextType | undefined>(undefined)

export const StopsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stops, setStopsState] = useState<Stop[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load stops from local storage on mount
  useEffect(() => {
    loadStopsFromStorage()
  }, [])

  // Save stops to local storage whenever stops change
  useEffect(() => {
    saveStopsToStorage(stops)
  }, [stops])

  const loadStopsFromStorage = async () => {
    try {
      setIsLoading(true)
      // In a web environment, use localStorage
      if (typeof window !== "undefined") {
        const savedStops = localStorage.getItem("dropflow_stops")
        if (savedStops) {
          const parsedStops = JSON.parse(savedStops)
          setStopsState(parsedStops)
        }
      }
    } catch (error) {
      console.error("Failed to load stops from storage:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveStopsToStorage = async (stopsToSave: Stop[]) => {
    try {
      // In a web environment, use localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("dropflow_stops", JSON.stringify(stopsToSave))
      }
    } catch (error) {
      console.error("Failed to save stops to storage:", error)
    }
  }

  const setStops = (newStops: Stop[]) => {
    setStopsState(newStops)
  }

  const updateStops = (newStops: Stop[]) => {
    setStopsState(newStops)
  }

  const updateStop = (updatedStop: Stop) => {
    setStopsState((prevStops) => prevStops.map((stop) => (stop.id === updatedStop.id ? updatedStop : stop)))
  }

  const addStop = (newStop: Stop) => {
    setStopsState((prevStops) => [...prevStops, newStop])
  }

  const removeStop = (stopId: string) => {
    setStopsState((prevStops) => prevStops.filter((stop) => stop.id !== stopId))
  }

  const clearStops = () => {
    setStopsState([])
  }

  const value = {
    stops,
    setStops,
    updateStops,
    updateStop,
    addStop,
    removeStop,
    clearStops,
    isLoading,
  }

  return <StopsContext.Provider value={value}>{children}</StopsContext.Provider>
}

export const useStops = () => {
  const context = useContext(StopsContext)
  if (context === undefined) {
    throw new Error("useStops must be used within a StopsProvider")
  }
  return context
}
