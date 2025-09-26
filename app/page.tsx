"use client"

import { useState } from "react"
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

declare global {
  interface Window {
    L: any
  }
}

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
    console.log("[v0] Adding stop:", address)
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
    console.log("[v0] Stop added, total stops:", newStops.length)
  }

  const removeStop = (id: string) => {
    console.log("[v0] Removing stop:", id)
    const newStops = stops.filter((s) => s.id !== id)
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
    }
  }

  const updateStopStatus = (id: string, status: Stop["status"]) => {
    console.log("[v0] Updating stop status:", id, status)
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

    console.log("[v0] Starting single import:", singleAddress)
    setIsImporting(true)
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    addStop(singleAddress.trim())
    setSingleAddress("")
    setIsImporting(false)
    console.log("[v0] Single import completed")
  }

  const handleBulkImport = async () => {
    if (!bulkAddresses.trim() || !canAddMore) return

    console.log("[v0] Starting bulk import")
    setIsImporting(true)
    const addresses = bulkAddresses
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0)

    console.log("[v0] Parsed addresses:", addresses)

    // Check if bulk import would exceed limit
    const totalAfterImport = stops.length + addresses.length
    if (!user?.isPremium && totalAfterImport > FREE_LIMIT) {
      alert(
        `Free users can only add up to ${FREE_LIMIT} addresses. You're trying to add ${addresses.length} addresses but only have ${FREE_LIMIT - stops.length} slots remaining.`,
      )
      setIsImporting(false)
      return
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    addresses.forEach((address) => addStop(address))
    setBulkAddresses("")
    setIsImporting(false)
    onImportComplete()
    console.log("[v0] Bulk import completed")
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

function SimpleMapView({ stops }: { stops: Stop[] }) {
  const pendingStops = stops.filter((s) => s.status === "pending")
  const completedStops = stops.filter((s) => s.status === "done")

  return (
    <div
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "12px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* SVG Map */}
      <svg width="100%" height="100%" viewBox="0 0 800 400" style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Background grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Map roads/streets */}
        <g stroke="#94a3b8" strokeWidth="2" fill="none">
          <path d="M 50 100 L 750 100" />
          <path d="M 50 200 L 750 200" />
          <path d="M 50 300 L 750 300" />
          <path d="M 200 50 L 200 350" />
          <path d="M 400 50 L 400 350" />
          <path d="M 600 50 L 600 350" />
        </g>

        {/* Delivery stop markers */}
        {stops.map((stop, index) => {
          const x = 150 + ((index * 120) % 500)
          const y = 120 + Math.floor(index / 4) * 80
          const isCompleted = stop.status === "done"

          return (
            <g key={stop.id}>
              {/* Marker shadow */}
              <circle cx={x + 2} cy={y + 2} r="16" fill="rgba(0,0,0,0.2)" />
              {/* Marker background */}
              <circle cx={x} cy={y} r="16" fill={isCompleted ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="3" />
              {/* Marker number */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {index + 1}
              </text>
              {/* Connecting line to next stop */}
              {index < stops.length - 1 && (
                <line
                  x1={x}
                  y1={y}
                  x2={150 + (((index + 1) * 120) % 500)}
                  y2={120 + Math.floor((index + 1) / 4) * 80}
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* Map legend */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          background: "white",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: "14px",
        }}
      >
        <div style={{ fontWeight: "600", marginBottom: "8px" }}>Route Map</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
              }}
            />
            <span>{pendingStops.length} Pending</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
              }}
            />
            <span>{completedStops.length} Completed</span>
          </div>
        </div>
      </div>

      {/* Stop count indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          background: "#6366f1",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        {stops.length} Stop{stops.length !== 1 ? "s" : ""}
      </div>
    </div>
  )
}

function RoutePlanning({ stops, updateStopStatus, removeStop }: RoutePlanningProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState<Stop[]>([])

  const optimizeRoute = async () => {
    console.log("[v0] Starting route optimization")
    setIsOptimizing(true)
    // Simulate route optimization
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simple optimization: sort by address (in real app, this would use Google Maps API)
    const optimized = [...stops].sort((a, b) => a.address.localeCompare(b.address))
    setOptimizedRoute(optimized)
    setIsOptimizing(false)
    console.log("[v0] Route optimization completed")
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
            <SimpleMapView stops={stops} />
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

  console.log("[v0] App render - stops count:", stops.length)

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
