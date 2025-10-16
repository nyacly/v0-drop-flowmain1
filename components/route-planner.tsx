"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import MapView from "@/components/MapView.web"
import { DeliveryProgress } from "@/components/delivery-progress"
import { useAddresses } from "@/hooks/use-addresses"
import { useState } from "react"

// Mock data and types from app/page.tsx
interface Stop {
  id: string
  address: string
  status: "pending" | "done" | "skipped"
  coordinates?: { lat: number; lng: number }
  notes?: string
  description?: string
}

interface RoutePlannerProps {
  stops: Stop[]
  onUpdateStatus: (id: string, status: Stop["status"]) => void
  onReorder: (stops: Stop[]) => void
  onNavigateBack: () => void
}

export function RoutePlanner({ stops, onUpdateStatus, onReorder, onNavigateBack }: RoutePlannerProps) {
  const { routes } = useAddresses()
  const activeRoute = routes.find((route) => route.status === "active")
  const [showRoute, setShowRoute] = useState(false)

  // Filter pending stops for navigation
  const pendingStops = stops.filter((stop) => stop.status === "pending")

  const handleNavigateRoute = () => {
    // Check if we have at least 2 pending stops
    if (pendingStops.length < 2) {
      window.alert("Need at least 2 stops to navigate")
      return
    }

    // Check if all pending stops have coordinates
    const hasAllCoordinates = pendingStops.every((stop) => stop.coordinates)
    if (!hasAllCoordinates) {
      window.alert("Some addresses couldn't be geocoded. Please re-add them.")
      return
    }

    // Build Google Maps URL with all pending stops
    const coordinateStrings = pendingStops.map((stop) => {
      return `${stop.coordinates!.lat},${stop.coordinates!.lng}`
    })

    // Format: https://www.google.com/maps/dir/START_LAT,START_LNG/WAYPOINT1_LAT,WAYPOINT1_LNG/.../END_LAT,END_LNG
    const googleMapsUrl = `https://www.google.com/maps/dir/${coordinateStrings.join("/")}`

    // Navigate to Google Maps in same tab
    window.location.href = googleMapsUrl
  }

  return (
    <div className="space-y-6">
      <Button onClick={onNavigateBack} variant="outline">
        &larr; Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{activeRoute ? `Current Route: ${activeRoute.name}` : "Live Route"}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeliveryProgress stops={stops} activeRoute={activeRoute} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            {pendingStops.length >= 2 && (
              <div className="p-4 border-b">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowRoute(!showRoute)}
                    variant="outline"
                    className="flex-1"
                  >
                    {showRoute ? "Hide Route" : "Show Route"}
                  </Button>
                  <Button onClick={handleNavigateRoute} className="flex-1">
                    🗺️ Navigate Full Route ({pendingStops.length} stops)
                  </Button>
                </div>
              </div>
            )}
            <MapView stops={stops} showRoute={showRoute} />
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Stops</CardTitle>
            </CardHeader>
            <CardContent>
              {/* This is a simplified view. A real implementation would have more interactive elements. */}
                  <div className="space-y-3">
                {stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className={`p-3 border rounded-lg transition-all ${
                      stop.status === "done" ? "bg-green-50 border-green-200" : ""
                    } ${stop.status === "skipped" ? "bg-yellow-50 border-yellow-200" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {index + 1}. {stop.address}
                        </p>
                        {stop.description && <p className="text-sm text-muted-foreground mt-1">{stop.description}</p>}
                      </div>
                      <Badge
                        variant={
                          stop.status === "done" ? "default" : stop.status === "skipped" ? "destructive" : "secondary"
                        }
                        className={`capitalize ml-2 ${
                          stop.status === "done" ? "bg-green-600" : stop.status === "skipped" ? "bg-yellow-600" : ""
                        }`}
                      >
                        {stop.status}
                      </Badge>
                    </div>
                    {stop.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => onUpdateStatus(stop.id, "done")}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Done
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateStatus(stop.id, "skipped")}
                          className="w-full"
                        >
                          Skip
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}