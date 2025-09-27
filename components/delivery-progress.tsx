"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin, Clock, CheckCircle, AlertCircle, Truck } from "lucide-react"

interface DeliveryStop {
  id: string
  address: string
  status: "pending" | "in-progress" | "completed" | "failed"
  estimatedTime: string
  actualTime?: string
  notes?: string
}

interface DeliveryRoute {
  id: string
  name: string
  driver: string
  vehicle: string
  stops: DeliveryStop[]
  startTime: string
  estimatedDuration: string
  status: "active" | "completed" | "paused"
}

export function DeliveryProgress() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([])
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  useEffect(() => {
    // Mock data for demonstration
    const mockRoutes: DeliveryRoute[] = [
      {
        id: "route-1",
        name: "Downtown Route A",
        driver: "John Smith",
        vehicle: "Truck #101",
        startTime: "08:00 AM",
        estimatedDuration: "4 hours",
        status: "active",
        stops: [
          {
            id: "stop-1",
            address: "123 Main St, Downtown",
            status: "completed",
            estimatedTime: "08:30 AM",
            actualTime: "08:25 AM",
            notes: "Package delivered to front desk",
          },
          {
            id: "stop-2",
            address: "456 Oak Ave, Midtown",
            status: "completed",
            estimatedTime: "09:15 AM",
            actualTime: "09:20 AM",
          },
          {
            id: "stop-3",
            address: "789 Pine St, Uptown",
            status: "in-progress",
            estimatedTime: "10:00 AM",
          },
          {
            id: "stop-4",
            address: "321 Elm Dr, Northside",
            status: "pending",
            estimatedTime: "10:45 AM",
          },
          {
            id: "stop-5",
            address: "654 Maple Ln, Eastside",
            status: "pending",
            estimatedTime: "11:30 AM",
          },
        ],
      },
      {
        id: "route-2",
        name: "Suburban Route B",
        driver: "Sarah Johnson",
        vehicle: "Van #205",
        startTime: "09:00 AM",
        estimatedDuration: "5 hours",
        status: "active",
        stops: [
          {
            id: "stop-6",
            address: "111 Sunset Blvd, Westside",
            status: "completed",
            estimatedTime: "09:30 AM",
            actualTime: "09:35 AM",
          },
          {
            id: "stop-7",
            address: "222 River Rd, Riverside",
            status: "in-progress",
            estimatedTime: "10:15 AM",
          },
          {
            id: "stop-8",
            address: "333 Hill St, Hillcrest",
            status: "pending",
            estimatedTime: "11:00 AM",
          },
        ],
      },
    ]

    setRoutes(mockRoutes)
  }, [])

  const getStatusColor = (status: DeliveryStop["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: DeliveryStop["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in-progress":
        return <Truck className="h-4 w-4 text-blue-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-gray-600" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const calculateProgress = (stops: DeliveryStop[]) => {
    const completed = stops.filter((stop) => stop.status === "completed").length
    return (completed / stops.length) * 100
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Delivery Progress</h2>
          <p className="text-muted-foreground">Track your active delivery routes in real-time</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {routes.map((route) => (
          <Card
            key={route.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {route.name}
                </CardTitle>
                <Badge variant={route.status === "active" ? "default" : "secondary"}>{route.status}</Badge>
              </div>
              <CardDescription>
                Driver: {route.driver} • Vehicle: {route.vehicle}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Started: {route.startTime}</span>
                  <span>Est. Duration: {route.estimatedDuration}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(calculateProgress(route.stops))}%</span>
                  </div>
                  <Progress value={calculateProgress(route.stops)} className="h-2" />
                </div>

                <div className="text-sm text-muted-foreground">
                  {route.stops.filter((s) => s.status === "completed").length} of {route.stops.length} stops completed
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRoute && (
        <Card>
          <CardHeader>
            <CardTitle>Route Details</CardTitle>
            <CardDescription>
              Detailed stop-by-stop progress for {routes.find((r) => r.id === selectedRoute)?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routes
                .find((r) => r.id === selectedRoute)
                ?.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(stop.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Stop {index + 1}</span>
                        <Badge className={getStatusColor(stop.status)}>{stop.status}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        {stop.address}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Est: {stop.estimatedTime}</span>
                        {stop.actualTime && <span className="text-green-600">Actual: {stop.actualTime}</span>}
                      </div>
                      {stop.notes && <p className="text-sm text-muted-foreground mt-2">{stop.notes}</p>}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
          <CardDescription>Visual representation of delivery routes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2" />
              <p>Interactive map view</p>
              <p className="text-sm">Map integration available with Google Maps API</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
