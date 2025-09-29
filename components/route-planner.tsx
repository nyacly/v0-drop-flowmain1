"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import MapView from "@/components/MapView.web"
import { DeliveryProgress } from "@/components/delivery-progress"
import { useAddresses } from "@/hooks/use-addresses"

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
            <MapView stops={stops} />
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