"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapView } from "@/components/MapView.web"
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
              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">
                        {index + 1}. {stop.address}
                      </p>
                      <p className="text-sm text-muted-foreground">{stop.description}</p>
                    </div>
                    <p className={`text-sm font-semibold ${stop.status === "done" ? "text-green-500" : "text-yellow-500"}`}>
                      {stop.status}
                    </p>
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