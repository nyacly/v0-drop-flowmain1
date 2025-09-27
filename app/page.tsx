"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Package, Users, LogOut, LogIn } from "lucide-react"
import { useAddresses, type DeliveryRoute } from "@/hooks/use-addresses"
import { DeliveryProgress } from "@/components/delivery-progress"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { AuthModal } from "@/components/auth/auth-modal"
import { AddressManager } from "@/components/address-manager"
import { RouteManager } from "@/components/route-manager"
import { RoutePlanner } from "@/components/route-planner"

// Mock data and types
interface Stop {
  id: string
  address: string
  status: "pending" | "done" | "skipped"
  coordinates?: { lat: number; lng: number }
  notes?: string
  description?: string
}

function useStops() {
  const [stops, setStops] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dropflow-stops")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse stops from localStorage", e)
          return []
        }
      }
    }
    return []
  })

  const addStop = (address: string, description?: string) => {
    console.log("[v0] Adding stop to state:", { address, description })
    const newStop = {
      id: Date.now().toString(),
      address,
      status: "pending",
      description,
    }
    const newStops = [...stops, newStop]
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
      console.log("[v0] Saved to localStorage, total stops:", newStops.length)
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

  const reorderStops = (newStops: Stop[]) => {
    setStops(newStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(newStops))
    }
  }

  const loadRouteStops = (route: DeliveryRoute) => {
    const routeStops = route.addresses.map((addr) => ({
      id: `route-${route.id}-${addr.id}`,
      address: addr.address,
      status: "pending" as const,
      description: addr.description,
    }))
    setStops(routeStops)
    if (typeof window !== "undefined") {
      localStorage.setItem("dropflow-stops", JSON.stringify(routeStops))
    }
  }

  return { stops, addStop, removeStop, updateStopStatus, reorderStops, loadRouteStops }
}

export default function DropFlowApp() {
  const { user, logout, isLoading } = useAuth()
  const { stops, addStop, removeStop, updateStopStatus, reorderStops, loadRouteStops } = useStops()
  const { addresses, routes } = useAddresses()
  const [currentView, setCurrentView] = useState<"home" | "addresses" | "routes" | "plan">("home")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalView, setAuthModalView] = useState<"login" | "signup">("login")
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isLoading && !user) {
      setShowAuthModal(true)
    }
  }, [user, isLoading, isMounted])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading DropFlow...</p>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    setShowAuthModal(true)
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
  }

  // Define hasActiveDelivery and activeRoute here
  const hasActiveDelivery = stops.some((stop) => stop.status === "pending")
  const activeRoute = routes.find((route) => route.status === "active")

  const handleCreateRoute = (routeId: string) => {
    setCurrentView("routes")
  }

  const handleStartRoute = (route: DeliveryRoute) => {
    loadRouteStops(route)
    setCurrentView("plan")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading DropFlow...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-4xl font-bold text-red-600 mb-4">🚛 DropFlow</h1>
            <p className="text-xl text-muted-foreground mb-6">Smart Delivery Route Optimization</p>
            <p className="text-muted-foreground mb-8">
              Sign in to start optimizing your delivery routes with AI-powered planning and live traffic data.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Demo Credentials</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Free Account:</strong> demo@dropflow.com / demo123
                </p>
                <p>
                  <strong>Premium Account:</strong> premium@dropflow.com / premium123
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setAuthModalView("login")
                  setShowAuthModal(true)
                }}
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button
                onClick={() => {
                  setAuthModalView("signup")
                  setShowAuthModal(true)
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultView={authModalView}
          onSuccess={handleAuthSuccess}
        />
      </>
    )
  }

  // Rest of the authenticated app UI
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-red-600 mb-2">🚛 DropFlow</h1>
            <p className="text-xl text-muted-foreground">
              Welcome back, {user?.firstName || user?.email?.split("@")[0] || "User"}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/account")}>
              <Users className="h-4 w-4 mr-2" />
              Account
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {currentView !== "home" && (
          <Button variant="outline" onClick={() => setCurrentView("home")} className="mb-6">
            &larr; Back to Dashboard
          </Button>
        )}

        {currentView === "home" && (
          <>
            {hasActiveDelivery && (
              <div className="mb-6">
                <DeliveryProgress
                  stops={stops}
                  activeRoute={activeRoute}
                  compact
                  onNavigateToRoute={() => setCurrentView("plan")}
                />
              </div>
            )}

            <Card className="mb-6 border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Manage your addresses and create optimized delivery routes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={() => setCurrentView("addresses")}
                    className="bg-red-600 hover:bg-red-700"
                    variant="default"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Manage Addresses
                  </Button>
                  <Button onClick={() => setCurrentView("routes")} variant="outline" className="bg-transparent">
                    <MapPin className="h-4 w-4 mr-2" />
                    Create Routes
                  </Button>
                </div>
                {routes.length > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    You have {routes.length} delivery route{routes.length !== 1 ? "s" : ""} ready
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setCurrentView("addresses")}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600 mb-1">{addresses.length}</p>
                    <p className="text-sm text-muted-foreground">Total Addresses</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setCurrentView("routes")}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600 mb-1">{routes.length}</p>
                    <p className="text-sm text-muted-foreground">Delivery Routes</p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setCurrentView("routes")}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600 mb-1">
                      {routes.filter((r) => r.status === "active").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Routes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{user?.isPremium ? "Premium Account" : "Free Account"}</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.isPremium
                        ? "Unlimited addresses and premium features"
                        : `${addresses.length}/15 addresses used`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push("/account")}>
                      <Users className="h-4 w-4 mr-2" />
                      Account Profile
                    </Button>
                    {!user?.isPremium && <Button size="sm">Upgrade to Premium</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {currentView === "addresses" && <AddressManager onCreateRoute={handleCreateRoute} />}
        {currentView === "routes" && <RouteManager onStartRoute={handleStartRoute} />}
        {currentView === "plan" && (
          <RoutePlanner
            stops={stops}
            onUpdateStatus={updateStopStatus}
            onReorder={reorderStops}
            onNavigateBack={() => setCurrentView("home")}
          />
        )}
      </div>
    </div>
  )
}
