"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Plus, Package, MapPin, Calendar, Search, RefreshCw, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { useAddresses } from "@/hooks/use-addresses"

interface AddressManagerProps {
  onCreateRoute?: (routeId: string) => void
}

export function AddressManager({ onCreateRoute }: AddressManagerProps) {
  const { addresses, addAddress, addAddressWithoutGeocoding, addAddresses, removeAddress, updateAddress, createRoute, reGeocodeAllAddresses } = useAddresses()
  const [newAddress, setNewAddress] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [bulkAddresses, setBulkAddresses] = useState("")
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set())
  const [routeName, setRouteName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [missingCoordinates, setMissingCoordinates] = useState<number>(0)
  const [showWarningBanner, setShowWarningBanner] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Single address loading and dialog states
  const [isSingleAddLoading, setIsSingleAddLoading] = useState(false)
  const [showGeocodingFailDialog, setShowGeocodingFailDialog] = useState(false)
  const [failedAddress, setFailedAddress] = useState<{ address: string; description: string } | null>(null)

  // Bulk import progress states
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; currentAddress: string; successful: number; skipped: number } | null>(null)
  const [isBulkImporting, setIsBulkImporting] = useState(false)

  // Error dialog state
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Success/info dialog state
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // Coordinate health check - detect addresses missing coordinates
  useEffect(() => {
    const missing = addresses.filter(
      (addr) => !addr.coordinates || !addr.coordinates.lat || !addr.coordinates.lng
    ).length
    setMissingCoordinates(missing)
  }, [addresses])

  // Filter addresses based on search term
  const filteredAddresses = addresses.filter(
    (addr) =>
      addr.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (addr.description && addr.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleAddSingle = async () => {
    if (!newAddress.trim()) return

    setIsSingleAddLoading(true)

    try {
      const result = await addAddress(newAddress.trim(), newDescription.trim())

      if (result.geocodingFailed) {
        // Save failed address info and show dialog
        setFailedAddress({ address: newAddress.trim(), description: newDescription.trim() })
        setShowGeocodingFailDialog(true)
        setIsSingleAddLoading(false)
        return
      }

      // Success - clear inputs
      setNewAddress("")
      setNewDescription("")
      setIsSingleAddLoading(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error adding address")
      setIsSingleAddLoading(false)
    }
  }

  const handleAddWithoutGeocoding = async () => {
    if (!failedAddress) return

    try {
      await addAddressWithoutGeocoding(failedAddress.address, failedAddress.description)
      
      // Success - clear inputs and close dialog
      setNewAddress("")
      setNewDescription("")
      setShowGeocodingFailDialog(false)
      setFailedAddress(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Error adding address")
    }
  }

  const handleRetryGeocoding = () => {
    // Close dialog and retry with same data
    setShowGeocodingFailDialog(false)
    
    if (failedAddress) {
      setNewAddress(failedAddress.address)
      setNewDescription(failedAddress.description)
      setFailedAddress(null)
      
      // Small delay to allow dialog to close, then retry
      setTimeout(() => {
        handleAddSingle()
      }, 100)
    }
  }

  const handleCancelGeocodingDialog = () => {
    setShowGeocodingFailDialog(false)
    setFailedAddress(null)
    setIsSingleAddLoading(false)
    // Keep inputs filled so user can edit
  }

  const handleBulkImport = async () => {
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

    setIsBulkImporting(true)
    setBulkProgress({ current: 0, total: addressList.length, currentAddress: '', successful: 0, skipped: 0 })

    const result = await addAddresses(addressList, (current, total, currentAddress, successful, skipped) => {
      setBulkProgress({ current, total, currentAddress, successful, skipped })
    })

    setIsBulkImporting(false)

    // Show results in dialog
    let message = `Successfully added ${result.added.length} addresses.`

    if (result.skipped && result.skipped.length > 0) {
      message += `\n\n${result.skipped.length} addresses skipped (geocoding failed after retries):\n${result.skipped.slice(0, 5).join("\n")}${result.skipped.length > 5 ? `\n...and ${result.skipped.length - 5} more` : ''}`
      message += `\n\n💡 Tip: For better geocoding results, include suburb, city, or state information.\nExample: "38 Timbury Street, Brisbane QLD" instead of "38 Timbury St"`
    }

    if (result.corrected && result.corrected.length > 0) {
      message += `\n\nAuto-corrected addresses:\n${result.corrected.slice(0, 3).join("\n")}${result.corrected.length > 3 ? `\n...and ${result.corrected.length - 3} more` : ''}`
    }

    if (result.errors.length > 0) {
      message += `\n\nValidation errors (${result.errors.length}):\n${result.errors.slice(0, 3).join("\n")}${result.errors.length > 3 ? `\n...and ${result.errors.length - 3} more` : ''}`
    }

    setInfoMessage(message)

    // Clear bulk progress after showing
    setTimeout(() => {
      setBulkProgress(null)
    }, 1000)

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
      setErrorMessage("Please enter a route name and select at least one address")
      return
    }

    const selectedAddressObjects = addresses.filter((addr) => selectedAddresses.has(addr.id))
    const route = createRoute(routeName.trim(), selectedAddressObjects)

    setRouteName("")
    setSelectedAddresses(new Set())

    if (onCreateRoute) {
      onCreateRoute(route.id)
    }

    setInfoMessage(`Route "${route.name}" created with ${selectedAddressObjects.length} addresses`)
  }

  const handleRefreshCoordinates = async () => {
    setIsRefreshing(true)

    try {
      const result = await reGeocodeAllAddresses()

      // Show results
      if (result.success > 0 && result.failed === 0) {
        setInfoMessage(`Successfully refreshed ${result.success} address(es).`)
      } else if (result.success > 0 && result.failed > 0) {
        setInfoMessage(`Successfully refreshed ${result.success} address(es).\n\n${result.failed} address(es) could not be geocoded. They may have invalid addresses.`)
      } else if (result.failed > 0) {
        setInfoMessage(`${result.failed} address(es) could not be geocoded. They may have invalid addresses.`)
      } else if (result.errors.length > 0) {
        setErrorMessage(`Error: ${result.errors.join(", ")}`)
      }

      // Log detailed errors to console
      if (result.errors.length > 0) {
        console.log("Geocoding errors:", result.errors)
      }
    } catch (error) {
      setErrorMessage(`Error refreshing coordinates: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner for Missing Coordinates */}
      {missingCoordinates > 0 && showWarningBanner && (
        <Card className="border-yellow-400 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm text-yellow-800">
                  Warning: {missingCoordinates} address(es) are missing GPS coordinates and won't appear on maps or routes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefreshCoordinates}
                  disabled={isRefreshing}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    "Refresh All Coordinates"
                  )}
                </Button>
                <Button
                  onClick={() => setShowWarningBanner(false)}
                  size="sm"
                  variant="ghost"
                  className="text-yellow-800 hover:text-yellow-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <Button onClick={handleAddSingle} disabled={!newAddress.trim() || isSingleAddLoading}>
            {isSingleAddLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSingleAddLoading ? "Adding..." : "Add Address"}
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
          ) : isBulkImporting && bulkProgress ? (
            // Show progress indicator during bulk import
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">Processing addresses...</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {bulkProgress.current} of {bulkProgress.total} processed
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                />
              </div>

              {/* Stats */}
              <div className="flex gap-4 justify-center text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{bulkProgress.successful} added</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>{bulkProgress.skipped} skipped</span>
                </div>
              </div>

              {/* Current address being processed */}
              {bulkProgress.currentAddress && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Currently processing:</p>
                  <p className="text-sm font-medium truncate">{bulkProgress.currentAddress}</p>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Addresses that fail geocoding after 3 retries will be skipped.
              </p>
            </div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              My Addresses ({addresses.length})
            </CardTitle>
            <Button
              onClick={handleRefreshCoordinates}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Coordinates"}
            </Button>
          </div>
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{address.address}</p>
                    {address.coordinates && address.coordinates.lat && address.coordinates.lng ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" title="Has coordinates" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" title="Missing coordinates - refresh needed" />
                    )}
                  </div>
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

      {/* Geocoding Failed Dialog */}
      <Dialog open={showGeocodingFailDialog} onOpenChange={setShowGeocodingFailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Geocoding Failed
            </DialogTitle>
            <DialogDescription>
              Unable to find GPS coordinates for this address after 3 automatic retry attempts.
            </DialogDescription>
          </DialogHeader>
          
          {failedAddress && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-gray-100 rounded-md">
                <p className="font-mono text-sm">{failedAddress.address}</p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm font-medium text-blue-900 mb-2">💡 Try adding more location details:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Add suburb or city: "{failedAddress.address}, Brisbane QLD"</li>
                  <li>• Add state: "{failedAddress.address}, Queensland"</li>
                  <li>• Add postcode: "{failedAddress.address}, QLD 4000"</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                Click <strong>Cancel</strong> to edit the address, or click <strong>Add Anyway</strong> to save it without coordinates (won't appear on maps until coordinates are added later).
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleCancelGeocodingDialog} variant="outline">
              Cancel & Edit
            </Button>
            <Button onClick={handleRetryGeocoding} variant="secondary">
              Retry Now
            </Button>
            <Button onClick={handleAddWithoutGeocoding} variant="default">
              Add Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorMessage !== null} onOpenChange={(open) => !open && setErrorMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Error
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorMessage(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info/Success Dialog */}
      <Dialog open={infoMessage !== null} onOpenChange={(open) => !open && setInfoMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Success
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {infoMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setInfoMessage(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
