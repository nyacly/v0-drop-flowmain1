"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, Settings, LogOut, Truck } from "lucide-react"
import { useRouter } from "next/navigation"

import { AddressManager } from "@/components/address-manager"
import { RouteManager } from "@/components/route-manager"
import { DeliveryProgress } from "@/components/delivery-progress"
import { useAddresses } from "@/hooks/use-addresses"

export default function DropFlowApp() {
  const { user, login, logout, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loginError, setLoginError] = useState("")
  const [signupError, setSignupError] = useState("")
  const [currentView, setCurrentView] = useState<"dashboard" | "addresses" | "routes" | "progress">("dashboard")

  const { addresses, routes } = useAddresses()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    try {
      await login(email, password)
    } catch (error) {
      setLoginError("Login failed. Please try again.")
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError("")

    if (password !== confirmPassword) {
      setSignupError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters long.")
      return
    }

    try {
      await login(email, password)
    } catch (error) {
      setSignupError("Signup failed. Please try again.")
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setFirstName("")
    setLastName("")
    setLoginError("")
    setSignupError("")
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-md mx-auto p-6">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Truck className="h-10 w-10 text-red-600" />
              <h1 className="text-4xl font-bold text-red-600">DropFlow</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-2">Smart Delivery Route Optimization</p>
            <p className="text-sm text-muted-foreground">Sign in or create an account to get started</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="signin" onValueChange={resetForm}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="p-6">
                  <div className="space-y-2 mb-4">
                    <h3 className="text-lg font-semibold">Welcome back</h3>
                    <p className="text-sm text-muted-foreground">Enter your credentials to access your dashboard</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    {loginError && <p className="text-sm text-red-600">{loginError}</p>}
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                      Sign In
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">Demo: Use any email and password to sign in</p>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="p-6">
                  <div className="space-y-2 mb-4">
                    <h3 className="text-lg font-semibold">Create account</h3>
                    <p className="text-sm text-muted-foreground">Get started with your delivery optimization</p>
                  </div>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    {signupError && <p className="text-sm text-red-600">{signupError}</p>}
                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                      Create Account
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">Demo: Use any valid email and password</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (currentView === "addresses") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className="mb-4">
                ← Back to Dashboard
              </Button>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-8 w-8 text-red-600" />
                <h1 className="text-3xl font-bold">Address Manager</h1>
              </div>
              <p className="text-muted-foreground">Manage your delivery addresses and locations</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <AddressManager />
        </div>
      </div>
    )
  }

  if (currentView === "routes") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className="mb-4">
                ← Back to Dashboard
              </Button>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-8 w-8 text-red-600" />
                <h1 className="text-3xl font-bold">Route Manager</h1>
              </div>
              <p className="text-muted-foreground">Create and optimize your delivery routes</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <RouteManager />
        </div>
      </div>
    )
  }

  if (currentView === "progress") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => setCurrentView("dashboard")} className="mb-4">
                ← Back to Dashboard
              </Button>
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-8 w-8 text-red-600" />
                <h1 className="text-3xl font-bold">Delivery Progress</h1>
              </div>
              <p className="text-muted-foreground">Track your active deliveries in real-time</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DeliveryProgress />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Truck className="h-10 w-10 text-red-600" />
              <h1 className="text-4xl font-bold text-red-600">DropFlow</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Welcome back, {user?.firstName || user?.displayName || user?.email?.split("@")[0] || "nyachy"}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📍 Address Manager</CardTitle>
              <CardDescription>Manage delivery addresses and locations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Add, edit, and organize your delivery addresses for route optimization.
              </p>
              <Button className="w-full" onClick={() => setCurrentView("addresses")}>
                Manage Addresses
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🗺️ Route Manager</CardTitle>
              <CardDescription>Create and optimize delivery routes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Generate optimized routes with AI-powered planning and traffic data.
              </p>
              <Button className="w-full" onClick={() => setCurrentView("routes")}>
                Create Routes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">📊 Delivery Progress</CardTitle>
              <CardDescription>Track active deliveries in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor delivery progress and get live updates on your routes.
              </p>
              <Button className="w-full" onClick={() => setCurrentView("progress")}>
                View Progress
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Your delivery performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {routes.filter((route) => route.status === "active").length}
                </div>
                <div className="text-sm text-muted-foreground">Active Routes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{addresses.length}</div>
                <div className="text-sm text-muted-foreground">Addresses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {routes.filter((route) => route.status === "completed").length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {routes.length > 0
                    ? Math.round((routes.filter((route) => route.status === "completed").length / routes.length) * 100)
                    : 0}
                  %
                </div>
                <div className="text-sm text-muted-foreground">Efficiency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
