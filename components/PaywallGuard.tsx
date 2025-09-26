"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { Alert } from "react-native"
import { useSubscription } from "../contexts/SubscriptionContext"

interface PaywallGuardContextType {
  checkStopLimit: (currentStopCount: number) => boolean
  showUpgradeAlert: () => void
}

const PaywallGuardContext = createContext<PaywallGuardContextType | undefined>(undefined)

export const PaywallGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isProUser, subscription } = useSubscription()

  const checkStopLimit = (currentStopCount: number): boolean => {
    // Pro users have unlimited stops
    if (isProUser) {
      return true
    }

    // Free users are limited to the subscription limit
    if (currentStopCount > subscription.stopsLimit) {
      showUpgradeAlert()
      return false
    }

    return true
  }

  const showUpgradeAlert = () => {
    Alert.alert(
      "Upgrade Required",
      `You've reached the ${subscription.stopsLimit}-stop limit for free users. Upgrade to Pro for unlimited stops and advanced route optimization features.`,
      [
        {
          text: "Maybe Later",
          style: "cancel",
        },
        {
          text: "Upgrade to Pro",
          style: "default",
          onPress: () => {
            // In a real app, this would navigate to the subscription upgrade flow
            Alert.alert(
              "Upgrade Coming Soon",
              "Pro subscription features will be available soon. For now, you can continue with up to 10 stops.",
              [{ text: "OK", style: "default" }],
            )
          },
        },
      ],
    )
  }

  const value = {
    checkStopLimit,
    showUpgradeAlert,
  }

  return <PaywallGuardContext.Provider value={value}>{children}</PaywallGuardContext.Provider>
}

export const usePaywallGuard = () => {
  const context = useContext(PaywallGuardContext)
  if (context === undefined) {
    throw new Error("usePaywallGuard must be used within a PaywallGuardProvider")
  }
  return context
}
