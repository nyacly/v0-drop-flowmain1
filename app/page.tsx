"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, MapPin, Route, BarChart3, User, LogOut, Settings } from "lucide-react"
import { AddressManager } from "@/components/address-manager"
import { RouteManager } from "@/components/route-manager"
import { DeliveryProgress } from "@/components/delivery-progress"
import { AccountProfile } from "@/components/account-profile"
import { AuthModal } from "@/components/auth/auth-modal"
import { PWAInstall } from "@/components/pwa-install"
import { useAuth } from "@/hooks/useAuth"

type ViewType = "dashboard" | "addresses" | "routes" | "progress" | "account"

export default function DropFlowApp() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, logout, isLoading } = useAuth()

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[v0] Service Worker registered successfully:", registration)
        })
        .catch((error) => {
          console.log("[v0] Service Worker registration failed:", error)
        })
    }
  }, [])

  // Show auth modal if user is not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setShowAuthModal(true)
    }
  }, [user, isLoading])

  const handleSignOut = async () => {
    await logout()
    setCurrentView("dashboard")
    setShowAuthModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Truck className="h-12 w-12 text-red-600 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading DropFlow...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-red-600" />
              <h1 className="text-2xl font-bold text-red-600">DropFlow</h1>
              <Badge variant="secondary" className="ml-2">
                Pro
              </Badge>
            </div>

            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Welcome, {user.displayName || user.primaryEmail}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView("account")}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Account
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        {/* Navigation */}
        {user && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={currentView === "dashboard" ? "default" : "outline"}
              onClick={() => setCurrentView("dashboard")}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={currentView === "addresses" ? "default" : "outline"}
              onClick={() => setCurrentView("addresses")}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Addresses
            </Button>
            <Button
              variant={currentView === "routes" ? "default" : "outline"}
              onClick={() => setCurrentView("routes")}
              className="flex items-center gap-2"
            >
              <Route className="h-4 w-4" />
              Routes
            </Button>
            <Button
              variant={currentView === "progress" ? "default" : "outline"}
              onClick={() => setCurrentView("progress")}
              className="flex items-center gap-2"
            >
              <Truck className="h-4 w-4" />
              Progress
            </Button>
            <Button
              variant={currentView === "account" ? "default" : "outline"}
              onClick={() => setCurrentView("account")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Account
            </Button>
          </div>
        )}

        {/* Main Content */}
        {user ? (
          <>
            {currentView === "dashboard" && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Smart Delivery Route Optimization</h2>
                  <p className="text-xl text-muted-foreground">
                    Optimize your delivery routes with AI-powered planning
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <Card
                    className="border-red-200 bg-red-50 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setCurrentView("addresses")}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-600" />
                        Address Manager
                      </CardTitle>
                      <CardDescription>Manage delivery addresses and locations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add, edit, and organize your delivery addresses for route optimization.
                      </p>
                      <Button className="w-full bg-red-600 hover:bg-red-700">Manage Addresses</Button>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-blue-200 bg-blue-50 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setCurrentView("routes")}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Route className="h-5 w-5 text-blue-600" />
                        Route Manager
                      </CardTitle>
                      <CardDescription>Create and optimize delivery routes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate optimized routes with AI-powered planning and traffic data.
                      </p>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Routes</Button>
                    </CardContent>
                  </Card>

                  <Card
                    className="border-green-200 bg-green-50 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setCurrentView("progress")}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-green-600" />
                        Delivery Progress
                      </CardTitle>
                      <CardDescription>Track active deliveries in real-time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Monitor delivery progress and get live updates on your routes.
                      </p>
                      <Button className="w-full bg-green-600 hover:bg-green-700">View Progress</Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                    <CardDescription>Your delivery performance overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">2</div>
                        <div className="text-sm text-muted-foreground">Active Routes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">15</div>
                        <div className="text-sm text-muted-foreground">Addresses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">8</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">94%</div>
                        <div className="text-sm text-muted-foreground">Efficiency</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentView === "addresses" && <AddressManager />}
            {currentView === "routes" && <RouteManager />}
            {currentView === "progress" && <DeliveryProgress />}
            {currentView === "account" && <AccountProfile />}
          </>
        ) : (
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to DropFlow</h2>
            <p className="text-muted-foreground mb-6">Please sign in to access your delivery management dashboard</p>
            <Button onClick={() => setShowAuthModal(true)} className="bg-red-600 hover:bg-red-700">
              Sign In to Continue
            </Button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <PWAInstall />
    </div>
  )
}
