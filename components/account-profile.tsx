"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, MapPin, CheckCircle, Eye, EyeOff, CreditCard } from "lucide-react"

interface Stop {
  id: string
  address: string
  status: "pending" | "done" | "skipped"
  coordinates?: { lat: number; lng: number }
  notes?: string
  completedAt?: string
}

interface UserProfile {
  email: string
  firstName?: string
  lastName?: string
  isPremium: boolean
  joinedDate: string
  totalDeliveries: number
}

interface AccountProfileProps {
  user: UserProfile
  stops: Stop[]
  isOpen: boolean
  onClose: () => void
}

export function AccountProfile({ user, stops, isOpen, onClose }: AccountProfileProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [showPassword, setShowPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [profileForm, setProfileForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Mock data for past deliveries
  const pastDeliveries = [
    { id: "1", date: "2024-01-15", addresses: 8, timeSpent: "2h 45m", status: "completed" },
    { id: "2", date: "2024-01-12", addresses: 12, timeSpent: "3h 20m", status: "completed" },
    { id: "3", date: "2024-01-10", addresses: 6, timeSpent: "1h 55m", status: "completed" },
    { id: "4", date: "2024-01-08", addresses: 15, timeSpent: "4h 10m", status: "completed" },
    { id: "5", date: "2024-01-05", addresses: 9, timeSpent: "2h 30m", status: "completed" },
  ]

  // All historical addresses (current + past)
  const allHistoricalAddresses = [
    // Ensure all stops have a valid status, defaulting to 'pending' if missing
    ...(stops || [])
      .filter((stop) => stop && stop.address) // Filter out null/undefined stops
      .map((stop) => ({
        ...stop,
        status: stop.status || "pending", // Ensure status is never null/undefined
        dateAdded: "2024-01-16",
      })),
    { id: "h1", address: "456 Oak Street, Springfield, IL 62701", status: "done" as const, dateAdded: "2024-01-15" },
    { id: "h2", address: "789 Pine Avenue, Chicago, IL 60601", status: "done" as const, dateAdded: "2024-01-15" },
    { id: "h3", address: "321 Elm Drive, Peoria, IL 61602", status: "done" as const, dateAdded: "2024-01-12" },
    { id: "h4", address: "654 Maple Lane, Rockford, IL 61101", status: "done" as const, dateAdded: "2024-01-12" },
    { id: "h5", address: "987 Cedar Court, Naperville, IL 60540", status: "done" as const, dateAdded: "2024-01-10" },
  ]

  const handleSaveProfile = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert("Profile updated successfully!")
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match")
      return
    }

    setIsChangingPassword(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsChangingPassword(false)
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    alert("Password changed successfully!")
  }

  const completedStops = (stops || []).filter((s) => s && s.status === "done")
  const totalAddressesUsed = allHistoricalAddresses.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="h-6 w-6" />
            Account Profile
          </DialogTitle>
          <DialogDescription className="text-base">
            Manage your account details, view delivery history, and track your addresses
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full justify-start gap-1 mb-6 h-auto p-1">
            <TabsTrigger value="details" className="px-4 py-2 text-sm font-medium">
              Account Details
            </TabsTrigger>
            <TabsTrigger value="password" className="px-4 py-2 text-sm font-medium">
              Change Password
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="px-4 py-2 text-sm font-medium">
              Past Deliveries
            </TabsTrigger>
            <TabsTrigger value="addresses" className="px-4 py-2 text-sm font-medium">
              All Addresses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your account details and subscription status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={user.email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinedDate">Member Since</Label>
                    <Input id="joinedDate" value={user.joinedDate || "January 2024"} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="pt-6 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Subscription Status
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {user.isPremium ? "Premium Account - Unlimited addresses" : "Free Account - Up to 15 addresses"}
                      </p>
                    </div>
                    <Badge variant={user.isPremium ? "default" : "secondary"} className="text-sm px-3 py-1">
                      {user.isPremium ? "Premium" : "Free"}
                    </Badge>
                  </div>
                  {!user.isPremium && (
                    <Button className="w-full md:w-auto" size="sm">
                      Upgrade to Premium
                    </Button>
                  )}
                </div>

                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                  {isSaving ? "Saving Changes..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-bold text-primary">{user.totalDeliveries || pastDeliveries.length}</p>
                    <p className="text-sm text-muted-foreground font-medium">Total Delivery Routes</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-bold text-primary">{completedStops.length}</p>
                    <p className="text-sm text-muted-foreground font-medium">Current Completed</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <p className="text-3xl font-bold text-primary">{totalAddressesUsed}</p>
                    <p className="text-sm text-muted-foreground font-medium">Total Addresses Used</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password for security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={
                    isChangingPassword ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword
                  }
                  className="w-full"
                >
                  {isChangingPassword ? "Changing Password..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deliveries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery History</CardTitle>
                <CardDescription>Your past delivery routes and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="font-medium">{delivery.date}</p>
                          <p className="text-sm text-muted-foreground">
                            {delivery.addresses} addresses delivered in {delivery.timeSpent}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Completed
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Address History</CardTitle>
                <CardDescription>All addresses you've added to your delivery routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allHistoricalAddresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-medium truncate">{address.address}</p>
                          <p className="text-xs text-muted-foreground">Added on {address.dateAdded}</p>
                        </div>
                      </div>
                      <Badge
                        variant={address.status === "done" ? "default" : "secondary"}
                        className={address.status === "done" ? "bg-green-100 text-green-800 border-green-200" : ""}
                      >
                        {address.status === "done" ? "Delivered" : "Current"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
