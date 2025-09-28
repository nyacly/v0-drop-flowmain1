"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, MapPin, CheckCircle, Truck } from "lucide-react"
import type { DeliveryRoute } from "@/hooks/use-addresses"
import { getGoogleMapsApiKey } from "@/lib/google-maps"

interface Stop {
  id: string
  address: string
  status: "pending" | "done" | "skipped"
  coordinates?: { lat: number; lng: number }
  notes?: string
  description?: string
}

interface DeliveryProgressProps {
  stops: Stop[]
  activeRoute?: DeliveryRoute
  compact?: boolean
  className?: string
  onNavigateToRoute?: () => void
}

export function DeliveryProgress({
  stops,
  activeRoute,
  compact = false,
  className = "",
  onNavigateToRoute,
}: DeliveryProgressProps) {
  // Guard against inconsistent state where stops are active but there's no route.
  if (!activeRoute && stops.some((s) => s.status === "pending")) {
    return null
  }

  const [currentTime, setCurrentTime] = useState(new Date())
  const [estimatedCompletion, setEstimatedCompletion] = useState<Date | null>(null)
  const [trafficAwareETA, setTrafficAwareETA] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

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

  const calculateTrafficAwareETA = async (pendingStops: Stop[]) => {
    if (!currentLocation || pendingStops.length === 0) {
      return null
    }

    try {
      const apiKey = await getGoogleMapsApiKey()

      if (typeof window !== "undefined" && window.google && window.google.maps) {
        const directionsService = new window.google.maps.DirectionsService()
        const geocoder = new window.google.maps.Geocoder()

        // Geocode all addresses first
        const geocodePromises = pendingStops.map((stop) => {
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

        if (validPositions.length === 0) return null

        return new Promise<string>((resolve) => {
          const origin = currentLocation
          const destination = validPositions[validPositions.length - 1]
          const waypoints = validPositions.slice(0, -1).map((pos) => ({ location: pos, stopover: true }))

          directionsService.route(
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
            },
            (result: any, status: string) => {
              if (status === "OK" && result) {
                const route = result.routes[0]
                let totalDurationInTraffic = 0

                route.legs.forEach((leg: any) => {
                  totalDurationInTraffic += leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value
                })

                // Add estimated stop time (10 minutes per stop)
                const stopTime = pendingStops.length * 10 * 60 // 10 minutes per stop in seconds
                const totalTime = totalDurationInTraffic + stopTime

                const hours = Math.floor(totalTime / 3600)
                const minutes = Math.floor((totalTime % 3600) / 60)

                if (hours > 0) {
                  resolve(`${hours}h ${minutes}m`)
                } else {
                  resolve(`${minutes}m`)
                }
              } else {
                resolve("")
              }
            },
          )
        })
      }
    } catch (error) {
      console.error("Error calculating traffic-aware ETA:", error)
    }

    return null
  }

  // Calculate estimated completion time
  useEffect(() => {
    const pendingStops = stops.filter((s) => s.status === "pending")
    if (pendingStops.length > 0) {
      // Basic estimate: 10 minutes per stop + 5 minutes travel time between stops
      const estimatedMinutes = pendingStops.length * 10 + (pendingStops.length - 1) * 5
      const completion = new Date()
      completion.setMinutes(completion.getMinutes() + estimatedMinutes)
      setEstimatedCompletion(completion)

      // Traffic-aware ETA calculation
      if (currentLocation && typeof window !== "undefined" && window.google) {
        calculateTrafficAwareETA(pendingStops).then((eta) => {
          setTrafficAwareETA(eta)
        })
      }
    } else {
      setEstimatedCompletion(null)
      setTrafficAwareETA(null)
    }
  }, [stops, currentLocation])

  const totalStops = stops.length
  const completedStops = stops.filter((s) => s.status === "done").length
  const pendingStops = stops.filter((s) => s.status === "pending").length
  const completionPercentage = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatETA = (eta: Date) => {
    const now = new Date()
    const diffMs = eta.getTime() - now.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))

    if (diffMins < 60) {
      return `${diffMins}m`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours}h ${mins}m`
    }
  }

  const getTrafficAwareCompletionTime = () => {
    if (!trafficAwareETA) return null

    const now = new Date()
    const etaMatch = trafficAwareETA.match(/(\d+)h\s*(\d+)m|(\d+)m/)

    if (etaMatch) {
      let totalMinutes = 0
      if (etaMatch[1] && etaMatch[2]) {
        // Format: "1h 30m"
        totalMinutes = Number.parseInt(etaMatch[1]) * 60 + Number.parseInt(etaMatch[2])
      } else if (etaMatch[3]) {
        // Format: "30m"
        totalMinutes = Number.parseInt(etaMatch[3])
      }

      const completion = new Date(now.getTime() + totalMinutes * 60000)
      return completion
    }

    return null
  }

  if (totalStops === 0) {
    return null
  }

  const isCompleted = completedStops === totalStops
  const isActive = pendingStops > 0
  const trafficCompletion = getTrafficAwareCompletionTime()

  if (compact) {
    return (
      <Card
        className={`border-primary bg-primary/5 ${onNavigateToRoute ? "cursor-pointer hover:bg-primary/10 transition-colors" : ""} ${className}`}
        onClick={onNavigateToRoute}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Truck
                  className={`h-5 w-5 ${isCompleted ? "text-green-600" : "text-primary"} ${isActive ? "animate-pulse" : ""}`}
                />
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {isCompleted ? "Route Completed!" : activeRoute?.name || "Active Route"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {completedStops}/{totalStops} deliveries • {completionPercentage}% complete
                </p>
              </div>
            </div>
            <div className="text-right">
              {isCompleted ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : trafficCompletion ? (
                <div className="text-xs">
                  <p className="font-medium text-blue-600">ETA: {formatTime(trafficCompletion)}</p>
                  <p className="text-muted-foreground">{trafficAwareETA} remaining</p>
                </div>
              ) : estimatedCompletion ? (
                <div className="text-xs">
                  <p className="font-medium">ETA: {formatTime(estimatedCompletion)}</p>
                  <p className="text-muted-foreground">{formatETA(estimatedCompletion)} remaining</p>
                </div>
              ) : null}
            </div>
          </div>
          <Progress value={completionPercentage} className="mt-3 h-2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`border-primary bg-gradient-to-r from-primary/5 to-blue-50 ${onNavigateToRoute ? "cursor-pointer hover:from-primary/10 hover:to-blue-100 transition-colors" : ""} ${className}`}
      onClick={onNavigateToRoute}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`p-3 rounded-full ${isCompleted ? "bg-green-100" : "bg-primary/10"}`}>
                <Truck
                  className={`h-6 w-6 ${isCompleted ? "text-green-600" : "text-primary"} ${isActive ? "animate-pulse" : ""}`}
                />
              </div>
              {isActive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isCompleted ? "Route Completed!" : activeRoute?.name || "Active Delivery Route"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isCompleted ? "All deliveries have been completed successfully" : "Route in progress"}
              </p>
            </div>
          </div>

          <div className="text-right">
            {isCompleted ? (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                <Clock className="h-4 w-4 mr-2" />
                In Progress
              </Badge>
            )}
          </div>
        </div>

        {/* Flight-style progress bar */}
        <div className="relative mb-4">
          <Progress value={completionPercentage} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Start</span>
            <span className="font-medium">{completionPercentage}% Complete</span>
            <span>Finish</span>
          </div>
        </div>

        {/* Flight info style stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">{completedStops}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </div>

          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">{pendingStops}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>

          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">{completionPercentage}%</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>

          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Truck className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold">
              {trafficCompletion ? (
                <span className="text-blue-600">{formatTime(trafficCompletion)}</span>
              ) : estimatedCompletion ? (
                formatTime(estimatedCompletion)
              ) : (
                "--:--"
              )}
            </p>
            <p className="text-xs text-muted-foreground">{trafficAwareETA ? "Traffic ETA" : "ETA"}</p>
          </div>
        </div>

        {/* Time remaining */}
        {!isCompleted && (trafficCompletion || estimatedCompletion) && (
          <div className="mt-4 space-y-2">
            {trafficAwareETA && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-blue-700">🚦 Traffic-aware time remaining</p>
                <p className="text-xl font-bold text-blue-600">{trafficAwareETA}</p>
              </div>
            )}
            {estimatedCompletion && trafficAwareETA && (
              <div className="p-2 bg-white/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Basic estimate: {formatETA(estimatedCompletion)}</p>
              </div>
            )}
            {!trafficAwareETA && estimatedCompletion && (
              <div className="p-3 bg-white/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Estimated time remaining</p>
                <p className="text-xl font-bold text-primary">{formatETA(estimatedCompletion)}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
