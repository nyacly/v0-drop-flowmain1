"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, CheckCircle, Clock, Plus, AlertCircle } from "lucide-react"

// Mock data and types
interface Stop {
  id: string
  address: string
  status: "pending" | "done" | "skipped"
  coordinates?: { lat: number; lng: number }
  notes?: string
}

interface User {
  email: string
  firstName?: string
  isPremium: boolean
}

// Mock hooks
function useAuth() {
  const [user] = useState<User>({
    email: "demo@dropflow.com",
    firstName: "Demo",
    isPremium: false,
  })
  return { user }
}

function useStops() {
  const [stops, setStops] = useState<Stop[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dropflow-stops")
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const addStop = (address: string) => {
    const newStop: Stop = {
      id: Date.now().toString(),
      address,
      status: "pending",
    }
    const newStops = [...stops, newStop]
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
    }
  }

  const removeStop = (id: string) => {
    const newStops = stops.filter((s) => s.id !== id)
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
    }
  }

  const updateStopStatus = (id: string, status: Stop["status"]) => {
    const newStops = stops.map((s) => (s.id === id ? { ...s, status } : s))
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
    }
  }

  return { stops, addStop, removeStop, updateStopStatus }
}

interface AddressImportProps {
  onImportComplete: () => void
  stops: Stop[]
  addStop: (address: string) => void
  user: User | null
}

function AddressImport({ onImportComplete, stops, addStop, user }: AddressImportProps) {
  const [singleAddress, setSingleAddress] = useState("")
  const [bulkAddresses, setBulkAddresses] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  const FREE_LIMIT = 10
  const canAddMore = user?.isPremium || stops.length < FREE_LIMIT

  const handleSingleImport = async () => {
    if (!singleAddress.trim() || !canAddMore) return

    setIsImporting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    addStop(singleAddress.trim())
    setSingleAddress("")
    setIsImporting(false)
  }

  const handleBulkImport = async () => {
    if (!bulkAddresses.trim() || !canAddMore) return

    setIsImporting(true)
    const addresses = bulkAddresses
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0)

    const totalAfterImport = stops.length + addresses.length
    if (!user?.isPremium && totalAfterImport > FREE_LIMIT) {
      alert(
        `Free users can only add up to ${FREE_LIMIT} addresses. You're trying to add ${addresses.length} addresses but only have ${FREE_LIMIT - stops.length} slots remaining.`,
      )
      setIsImporting(false)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    addresses.forEach((address) => addStop(address))
    setBulkAddresses("")
    setIsImporting(false)
    onImportComplete()
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Import Delivery Addresses</h2>
        <p className="text-muted-foreground">
          {user?.isPremium
            ? "Add unlimited addresses to your route"
            : `Free plan: ${stops.length}/${FREE_LIMIT} addresses used`}
        </p>
      </div>

      {!canAddMore && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Address limit reached</p>
            </div>
            <p className="text-sm text-orange-700 mt-1">Upgrade to Premium to add unlimited addresses</p>
            <Button className="mt-3" size="sm">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Address</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input
              placeholder="123 Main St, City, State, ZIP"
              value={singleAddress}
              onChange={(e) => setSingleAddress(e.target.value)}
              disabled={!canAddMore}
            />
          </div>
          <Button
            onClick={handleSingleImport}
            disabled={!singleAddress.trim() || isImporting || !canAddMore}
            className="w-full"
          >
            {isImporting ? "Adding..." : "Add Address"}
          </Button>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Addresses (one per line)</label>
            <Textarea
              placeholder="123 Main St, City, State, ZIP&#10;456 Oak Ave, City, State, ZIP&#10;789 Pine Rd, City, State, ZIP"
              value={bulkAddresses}
              onChange={(e) => setBulkAddresses(e.target.value)}
              rows={6}
              disabled={!canAddMore}
            />
          </div>
          <Button
            onClick={handleBulkImport}
            disabled={!bulkAddresses.trim() || isImporting || !canAddMore}
            className="w-full"
          >
            {isImporting ? "Importing..." : "Import Addresses"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface RoutePlanningProps {
  stops: Stop[]
  updateStopStatus: (id: string, status: Stop["status"]) => void
  removeStop: (id: string) => void
}

function InteractiveMapView({ stops }: { stops: Stop[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      try {
        // Add Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          document.head.appendChild(link)
        }

        // Load Leaflet JS
        const L = await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js")

        // Brisbane coordinates as center
        const map = L.map(mapRef.current).setView([-27.4698, 153.0251], 11)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map)

        // Add markers for each stop
        const markers: any[] = []
        stops.forEach((stop, index) => {
          // Use approximate coordinates around Brisbane for demo
          const lat = -27.4698 + (Math.random() - 0.5) * 0.2
          const lng = 153.0251 + (Math.random() - 0.5) * 0.2

          const isCompleted = stop.status === "done"
          const markerColor = isCompleted ? "#22c55e" : "#ef4444"

          // Create custom marker HTML
          const markerHtml = `
            <div style="
              background: ${markerColor};
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">${index + 1}</div>
          `

          const marker = L.marker([lat, lng], {
            icon: L.divIcon({
              html: markerHtml,
              className: "custom-marker",
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            }),
          }).addTo(map)

          marker.bindPopup(`
            <div style="padding: 8px;">
              <strong>Stop ${index + 1}</strong><br/>
              ${stop.address}<br/>
              <span style="color: ${markerColor}; font-weight: bold;">
                ${isCompleted ? "✓ Completed" : "⏳ Pending"}
              </span>
            </div>
          `)

          markers.push(marker)
        })

        // Draw route line between markers if there are multiple stops
        if (markers.length > 1) {
          const latlngs = markers.map((marker) => marker.getLatLng())
          L.polyline(latlngs, {
            color: "#6366f1",
            weight: 4,
            opacity: 0.8,
            dashArray: "10, 5",
          }).addTo(map)
        }

        // Fit map to show all markers
        if (markers.length > 0) {
          const group = new L.featureGroup(markers)
          map.fitBounds(group.getBounds().pad(0.1))
        }

        setMapInstance(map)
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to load map:", error)
        setIsLoading(false)
      }
    }

    loadLeaflet()

    return () => {
      if (mapInstance) {
        mapInstance.remove()
      }
    }
  }, [stops])

  const pendingStops = stops.filter((s) => s.status === "pending")
  const completedStops = stops.filter((s) => s.status === "done")

  const openInGoogleMaps = () => {
    const addresses = stops.map((stop) => encodeURIComponent(stop.address))
    if (addresses.length === 1) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${addresses[0]}`, "_blank")
    } else {
      const waypoints = addresses.slice(1).join("|")
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${addresses[0]}&waypoints=${waypoints}`, "_blank")
    }
  }

  const openInAppleMaps = () => {
    const addresses = stops.map((stop) => encodeURIComponent(stop.address))
    if (addresses.length === 1) {
      window.open(`http://maps.apple.com/?daddr=${addresses[0]}`, "_blank")
    } else {
      window.open(`http://maps.apple.com/?daddr=${addresses[0]}`, "_blank")
    }
  }

  const openInWaze = () => {
    const firstAddress = encodeURIComponent(stops[0]?.address || "")
    window.open(`https://waze.com/ul?q=${firstAddress}&navigate=yes`, "_blank")
  }

  return (
    <div className="space-y-4">
      {/* Navigation buttons */}
      {stops.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={openInGoogleMaps} className="flex items-center gap-2 bg-transparent" variant="outline">
            <span>🗺️</span>
            Navigate with Google Maps
          </Button>
          <Button onClick={openInAppleMaps} className="flex items-center gap-2 bg-transparent" variant="outline">
            <span>🍎</span>
            Navigate with Apple Maps
          </Button>
          <Button onClick={openInWaze} className="flex items-center gap-2 bg-transparent" variant="outline">
            <span>🚗</span>
            Navigate with Waze
          </Button>
        </div>
      )}

      {/* Interactive Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "400px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        />

        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading interactive map...</p>
            </div>
          </div>
        )}

        {/* Map legend overlay */}
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
          <div className="font-semibold text-sm mb-2">Route Overview</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>{pendingStops.length} Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{completedStops.length} Completed</span>
            </div>
          </div>
        </div>

        {/* Stop count indicator */}
        <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium z-[1000]">
          {stops.length} Stop{stops.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  )
}

function RoutePlanning({ stops, updateStopStatus, removeStop }: RoutePlanningProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState<Stop[]>([])

  const optimizeRoute = async () => {
    setIsOptimizing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const optimized = [...stops].sort((a, b) => a.address.localeCompare(b.address))
    setOptimizedRoute(optimized)
    setIsOptimizing(false)
  }

  const pendingStops = stops.filter((s) => s.status === "pending")
  const completedStops = stops.filter((s) => s.status === "done")

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Route Planning</h2>
        <p className="text-muted-foreground">Optimize your delivery route for maximum efficiency</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stops.length}</p>
                <p className="text-sm text-muted-foreground">Total Stops</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{pendingStops.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completedStops.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
            <CardDescription>Interactive map with turn-by-turn navigation</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveMapView stops={stops} />
          </CardContent>
        </Card>
      )}

      {stops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Route Optimization</CardTitle>
            <CardDescription>Get the most efficient route for your deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={optimizeRoute} disabled={isOptimizing || stops.length < 2} className="w-full mb-4">
              {isOptimizing ? "Optimizing Route..." : "Optimize Route"}
            </Button>

            {optimizedRoute.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Optimized Route:</h4>
                {optimizedRoute.map((stop, index) => (
                  <div key={stop.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-sm">{stop.address}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={stop.status === "done" ? "default" : "outline"}
                        onClick={() => updateStopStatus(stop.id, stop.status === "done" ? "pending" : "done")}
                      >
                        {stop.status === "done" ? "Done" : "Mark Done"}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeStop(stop.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Main App Component
export default function DropFlowApp() {
  const { user } = useAuth()
  const { stops, addStop, removeStop, updateStopStatus } = useStops()
  const [showAddressImport, setShowAddressImport] = useState(false)
  const [currentView, setCurrentView] = useState<"home" | "plan">("home")

  const handleStartRoute = () => {
    if (stops.length === 0) {
      setShowAddressImport(true)
    } else {
      setCurrentView("plan")
    }
  }

  const handleImportComplete = () => {
    setShowAddressImport(false)
    if (stops.length > 0) {
      setCurrentView("plan")
    }
  }

  if (currentView === "plan") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setCurrentView("home")}>
              ← Back to Home
            </Button>
            <h1 className="text-2xl font-bold">🚛 DropFlow</h1>
            <div></div>
          </div>
          <RoutePlanning stops={stops} updateStopStatus={updateStopStatus} removeStop={removeStop} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">🚛 DropFlow</h1>
          <p className="text-xl text-muted-foreground">
            Welcome back, {user?.firstName || user?.email?.split("@")[0] || "User"}!
          </p>
        </div>

        {/* Quick Start Card */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              {stops.length === 0
                ? "Import your delivery addresses to get started with route optimization."
                : `You have ${stops.length} address${stops.length !== 1 ? "es" : ""} ready for route planning.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleStartRoute} className="w-full bg-red-600 hover:bg-red-700">
              {stops.length === 0 ? "Import Addresses" : "Plan Route"}
            </Button>
            {stops.length > 0 && (
              <Dialog open={showAddressImport} onOpenChange={setShowAddressImport}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent">
                    Manage Addresses
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Address Management</DialogTitle>
                    <DialogDescription>Add or remove delivery addresses from your route</DialogDescription>
                  </DialogHeader>
                  <AddressImport onImportComplete={handleImportComplete} stops={stops} addStop={addStop} user={user} />
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 mb-1">
                  {stops.filter((s) => s.status === "done").length}
                </p>
                <p className="text-sm text-muted-foreground">Deliveries Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 mb-1">{stops.length}</p>
                <p className="text-sm text-muted-foreground">Total Addresses</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600 mb-1">
                  {stops.filter((s) => s.status === "pending").length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Deliveries</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h4 className="font-medium">Smart Route Optimization</h4>
                  <p className="text-sm text-muted-foreground">AI-powered routing with real-time traffic</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h4 className="font-medium">Turn-by-Turn Navigation</h4>
                  <p className="text-sm text-muted-foreground">Integrated Google Maps directions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📸</span>
                <div>
                  <h4 className="font-medium">Proof of Delivery</h4>
                  <p className="text-sm text-muted-foreground">Photo capture and delivery notes</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{user?.isPremium ? "Premium Account" : "Free Account"}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.isPremium ? "Unlimited addresses and premium features" : `${stops.length}/10 addresses used`}
                </p>
              </div>
              {!user?.isPremium && <Button size="sm">Upgrade to Premium</Button>}
            </div>
          </CardContent>
        </Card>

        {/* Address Import Dialog */}
        <Dialog open={showAddressImport} onOpenChange={setShowAddressImport}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              Import Addresses
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Delivery Addresses</DialogTitle>
              <DialogDescription>Add addresses to your delivery route</DialogDescription>
            </DialogHeader>
            <AddressImport onImportComplete={handleImportComplete} stops={stops} addStop={addStop} user={user} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
