import { Slot } from "expo-router"
import { SubscriptionProvider } from "../contexts/SubscriptionContext"
import { AuthProvider } from "../hooks/useAuth"
import { StopsProvider } from "../contexts/StopsContext"
import { PaywallGuardProvider } from "../components/PaywallGuard"

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <StopsProvider>
          <PaywallGuardProvider>
            <Slot />
          </PaywallGuardProvider>
        </StopsProvider>
      </SubscriptionProvider>
    </AuthProvider>
  )
}
