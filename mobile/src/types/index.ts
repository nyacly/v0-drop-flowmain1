export type StopStatus = "pending" | "completed" | "skipped"

export interface Address {
  id: string
  address: string
  description?: string
  dateAdded: string
  timesUsed: number
  coordinates?: { lat: number; lng: number }
}

export interface DeliveryRoute {
  id: string
  name: string
  addresses: Address[]
  createdAt: string
  status: "draft" | "active" | "completed"
}

export interface DeliveryStop {
  id: string
  addressId: string
  address: string
  notes?: string
  status: StopStatus
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  isVerified: boolean
  isPremium?: boolean
}

export interface AuthResponse {
  success: boolean
  message: string
}
