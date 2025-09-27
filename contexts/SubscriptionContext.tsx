"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define the shape of the subscription context
interface SubscriptionContextType {
  isProUser: boolean
  subscription: {
    stopsLimit: number
    planName: string
  }
  checkSubscription: () => Promise<void>
  isLoading: boolean
}

// Create the context with a default value
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// Create a provider component
export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProUser, setIsProUser] = useState(false)
  const [subscription, setSubscription] = useState({
    stopsLimit: 10, // Default for free users
    planName: "Free",
  })
  const [isLoading, setIsLoading] = useState(true)

  // In a real app, this would fetch subscription status from the server
  const checkSubscription = async () => {
    setIsLoading(true)
    // For now, we'll just simulate a free user.
    // This can be expanded later to fetch from /api/check-subscription
    setIsProUser(false)
    setSubscription({
      stopsLimit: 10,
      planName: "Free",
    })
    setIsLoading(false)
  }

  useEffect(() => {
    checkSubscription()
  }, [])

  const value = { isProUser, subscription, checkSubscription, isLoading }

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

// Create a custom hook to use the subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider")
  }
  return context
}
