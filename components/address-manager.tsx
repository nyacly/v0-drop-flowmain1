"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Package, MapPin, Calendar, Search } from "lucide-react"
import { useAddresses } from "@/hooks/use-addresses"

interface AddressManagerProps {
  onCreateRoute?: (routeId: string) => void
}

export function AddressManager({ onCreateRoute }: AddressManagerProps) {
  const { addresses, addAddress, addAddresses, removeAddress, updateAddress, createRoute } = useAddresses()
  const [newAddress, setNewAddress] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [bulkAddresses, setBulkAddresses] = useState("")
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set())
  const [routeName, setRouteName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showBulkImport, setShowBulkImport] = useState(false)

  // Filter addresses based on search term
  const filteredAddresses = addresses.filter(
    (addr) =>
      addr.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (addr.description && addr.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleAddSingle = () => {
    if (!newAddress.trim()) return

    try {
      addAddress(newAddress.trim(), newDescription.trim())
      setNewAddress("")
      setNewDescription("")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error adding address")
    }
  }

  const handleBulkImport = () => {
    if (!bulkAddresses.trim()) return

    const lines = bulkAddresses.split(/\r?\n/).filter((line) => line.trim())
    const addressList = lines
      .map((line) => {
        const parts = line.split("|").map((part) => part.trim())
        return {
          address: parts[0] || "",
          description: parts[1] || "",
        }
      })
      .filter((item) => item.address)

    const result = addAddresses(addressList)

    let message = `Successfully added ${result.added.length} addresses.`

    if (result.corrected && result.corrected.length > 0) {
      message += `\n\nAuto-corrected addresses:\n${result.corrected.join("\n")}`
    }

    if (result.errors.length > 0) {
      message += `\n\nErrors (${result.errors.length}):\n${result.errors.join("\n")}`
    }

    alert(message)

    setBulkAddresses("")
    setShowBulkImport(false)
  }

  const handleSelectAddress = (addressId: string, checked: boolean) => {
    const newSelected = new Set(selectedAddresses)
    if (checked) {
      newSelected.add(addressId)
    } else {
      newSelected.delete(addressId)
    }
    setSelectedAddresses(newSelected)
  }

  const handleCreateRoute = () => {
    if (!routeName.trim() || selectedAddresses.size === 0) {
      alert("Please enter a route name and select at least one address")
      return
    }

    const selectedAddressObjects = addresses.filter((addr) => selectedAddresses.has(addr.id))
    const route = createRoute(routeName.trim(), selectedAddressObjects)

    setRouteName("")
    setSelectedAddresses(new Set())

    if (onCreateRoute) {
      onCreateRoute(route.id)
    }

    alert(`Route "${route.name}" created with ${selectedAddressObjects.length} addresses`)
  }

  return (
    <div className="space-y-6">
      {/* Add Single Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Single Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Enter address..." value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
          <Input
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
          <Button onClick={handleAddSingle} disabled={!newAddress.trim()}>
            Add Address
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showBulkImport ? (
            <Button onClick={() => setShowBulkImport(true)} variant="outline">
              Import Multiple Addresses
            </Button>
          ) : (
            <>
              <Textarea
                placeholder="Paste addresses here (one per line)&#10;Use | to separate address and description:&#10;123 Main St, City | 2 packages&#10;456 Oak Ave, Town | 1 envelope"
                value={bulkAddresses}
                onChange={(e) => setBulkAddresses(e.target.value)}
                rows={6}
              />
              <div className="flex gap-2">
                <Button onClick={handleBulkImport} disabled={!bulkAddresses.trim()}>
                  Import Addresses
                </Button>
                <Button onClick={() => setShowBulkImport(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Address List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            My Addresses ({addresses.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Address List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAddresses.map((address) => (
              <div key={address.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={selectedAddresses.has(address.id)}
                  onCheckedChange={(checked) => handleSelectAddress(address.id, checked as boolean)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{address.address}</p>
                  {address.description && <p className="text-sm text-muted-foreground">{address.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(address.dateAdded).toLocaleDateString()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Used {address.timesUsed} times
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeAddress(address.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {filteredAddresses.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? "No addresses match your search" : "No addresses added yet"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create Route */}
      {selectedAddresses.size > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" />
              Create Delivery Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedAddresses.size} addresses selected</p>
            <Input placeholder="Enter route name..." value={routeName} onChange={(e) => setRouteName(e.target.value)} />
            <Button onClick={handleCreateRoute} className="w-full">
              Create Route with {selectedAddresses.size} Addresses
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
