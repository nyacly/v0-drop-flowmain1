"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { MapPin, Calendar, Play, Trash2, Plus } from "lucide-react"
import { useAddresses, type DeliveryRoute } from "@/hooks/use-addresses"

interface RouteManagerProps {
  onStartRoute?: (route: DeliveryRoute) => void
}

export function RouteManager({ onStartRoute }: RouteManagerProps) {
  const { routes, addresses, deleteRoute, updateRoute, createRoute } = useAddresses()
  const [showCreateRoute, setShowCreateRoute] = useState(false)
  const [newRouteName, setNewRouteName] = useState("")
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([])

  const handleStartRoute = (route: DeliveryRoute) => {
    const nextRouteState: DeliveryRoute = {
      ...route,
      status: "active",
    }

    updateRoute(route.id, { status: "active" })

    if (onStartRoute) {
      onStartRoute(nextRouteState)
    }
  }

  const handleCreateRoute = () => {
    if (!newRouteName.trim() || selectedAddresses.length === 0) {
      alert("Please enter a route name and select at least one address")
      return
    }

    const routeAddresses = addresses.filter((addr) => selectedAddresses.includes(addr.id))
    createRoute(newRouteName.trim(), routeAddresses)

    // Reset form
    setNewRouteName("")
    setSelectedAddresses([])
    setShowCreateRoute(false)
  }

  const toggleAddressSelection = (addressId: string) => {
    setSelectedAddresses((prev) =>
      prev.includes(addressId) ? prev.filter((id) => id !== addressId) : [...prev, addressId],
    )
  }

  const getStatusColor = (status: DeliveryRoute["status"]) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "active":
        return "default"
      case "completed":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: DeliveryRoute["status"]) => {
    switch (status) {
      case "draft":
        return "Draft"
      case "active":
        return "Active"
      case "completed":
        return "Completed"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Delivery Routes</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{routes.length} routes</Badge>
          <Button onClick={() => setShowCreateRoute(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Route
          </Button>
        </div>
      </div>

      {showCreateRoute && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Create New Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Route Name</label>
              <Input
                placeholder="Enter route name (e.g., Morning Deliveries)"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
              />
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No addresses available</p>
                <p className="text-sm text-muted-foreground mt-1">Add addresses first using the Address Manager</p>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Addresses ({selectedAddresses.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {addresses.map((address) => (
                    <div key={address.id} className="flex items-start gap-3 p-2 hover:bg-muted rounded">
                      <Checkbox
                        checked={selectedAddresses.includes(address.id)}
                        onCheckedChange={() => toggleAddressSelection(address.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{address.address}</p>
                        {address.description && <p className="text-xs text-muted-foreground">{address.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCreateRoute}
                disabled={!newRouteName.trim() || selectedAddresses.length === 0}
                className="flex-1"
              >
                Create Route
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateRoute(false)
                  setNewRouteName("")
                  setSelectedAddresses([])
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {routes.length === 0 && !showCreateRoute ? (
        <Card>
          <CardContent className="py-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No delivery routes created yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              {addresses.length === 0
                ? "Add addresses first, then create your first delivery route"
                : `You have ${addresses.length} addresses ready to be organized into routes`}
            </p>
            {addresses.length > 0 && (
              <Button onClick={() => setShowCreateRoute(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Route
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {routes.map((route) => (
            <Card key={route.id} className={route.status === "active" ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {route.name}
                  </CardTitle>
                  <Badge variant={getStatusColor(route.status)}>{getStatusText(route.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(route.createdAt).toLocaleDateString()}
                  </span>
                  <span>{route.addresses.length} addresses</span>
                </div>

                {/* Address Preview */}
                <div className="space-y-2">
                  <p className="font-medium text-sm">Addresses:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {route.addresses.map((address, index) => (
                      <div key={address.id} className="text-sm p-2 bg-muted rounded">
                        <span className="font-medium">{index + 1}.</span> {address.address}
                        {address.description && (
                          <span className="text-muted-foreground ml-2">({address.description})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {route.status === "draft" && (
                    <Button onClick={() => handleStartRoute(route)} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Start Route
                    </Button>
                  )}
                  {route.status === "active" && (
                    <Button onClick={() => handleStartRoute(route)} className="flex-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      Continue Route
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRoute(route.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
