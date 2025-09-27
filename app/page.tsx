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
import { getGoogleMapsApiKey } from "@/lib/google-maps"

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

function GoogleMapView({ stops }: { stops: Stop[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [apiKey, setApiKey] = useState<string>("")

  const pendingStops = stops.filter((s) => s.status === "pending")
  const completedStops = stops.filter((s) => s.status === "done")

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const key = await getGoogleMapsApiKey()
        setApiKey(key)
      } catch (error) {
        console.error("Failed to fetch Google Maps API key:", error)
      }
    }
    fetchApiKey()
  }, [])

  useEffect(() => {
    if (apiKey && typeof window !== "undefined" && !window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)
    } else if (window.google) {
      setIsLoaded(true)
    }
  }, [apiKey])

  useEffect(() => {
    if (isLoaded && mapRef.current && !mapInstanceRef.current && window.google) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
        center: { lat: 40.7128, lng: -74.006 }, // Default to NYC
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      })

      directionsServiceRef.current = new window.google.maps.DirectionsService()
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#3b82f6",
          strokeWeight: 4,
        },
      })
      directionsRendererRef.current.setMap(mapInstanceRef.current)
    }
  }, [isLoaded])

  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || stops.length === 0 || !window.google) return

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    const geocoder = new window.google.maps.Geocoder()
    const bounds = new window.google.maps.LatLngBounds()

    const geocodePromises = stops.map((stop, index) => {
      return new Promise<any>((resolve) => {
        geocoder.geocode({ address: stop.address }, (results: any, status: string) => {
          if (status === "OK" && results && results[0]) {
            const position = results[0].geometry.location
            bounds.extend(position)

            const marker = new window.google.maps.Marker({
              position,
              map: mapInstanceRef.current,
              title: `Stop ${index + 1}: ${stop.address}`,
              label: {
                text: (index + 1).toString(),
                color: "white",
                fontWeight: "bold",
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 20,
                fillColor: stop.status === "done" ? "#10b981" : "#ef4444",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 3,
              },
            })

            markersRef.current.push(marker)
            resolve(position)
          } else {
            console.error(`Geocoding failed for ${stop.address}: ${status}`)
            resolve(null)
          }
        })
      })
    })

    Promise.all(geocodePromises).then((positions) => {
      const validPositions = positions.filter((pos) => pos !== null)

      if (validPositions.length > 0) {
        mapInstanceRef.current!.fitBounds(bounds)

        if (validPositions.length > 1 && directionsServiceRef.current && directionsRendererRef.current) {
          const waypoints = validPositions.slice(1, -1).map((pos) => ({
            location: pos,
            stopover: true,
          }))

          directionsServiceRef.current.route(
            {
              origin: validPositions[0],
              destination: validPositions[validPositions.length - 1],
              waypoints,
              travelMode: window.google.maps.TravelMode.DRIVING,
              optimizeWaypoints: true,
            },
            (result: any, status: string) => {
              if (status === "OK" && result) {
                directionsRendererRef.current!.setDirections(result)
              }
            },
          )
        }
      }
    })
  }, [isLoaded, stops])

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

      <div className="relative">
        {stops.length > 0 ? (
          <div className="w-full h-96 rounded-lg border border-gray-200 relative overflow-hidden">
            {(!isLoaded || !apiKey) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">
                    {!apiKey ? "Loading API configuration..." : "Loading Google Maps..."}
                  </p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />

            <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
              <div className="font-semibold text-sm mb-2">Route Map</div>
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

            <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
              {stops.length} Stop{stops.length !== 1 ? "s" : ""}
            </div>
          </div>
        ) : (
          <div className="w-full h-96 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center text-white">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold mb-2">No Stops Added</h3>
              <p className="text-sm opacity-90">Add delivery addresses to see them on the map</p>
            </div>
          </div>
        )}
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
            <CardDescription>Visual overview of your delivery stops</CardDescription>
          </CardHeader>
          <CardContent>
            <GoogleMapView stops={stops} />
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-600 mb-2">🚛 DropFlow</h1>
          <p className="text-xl text-muted-foreground">
            Welcome back, {user?.firstName || user?.email?.split("@")[0] || "User"}!
          </p>
        </div>

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
