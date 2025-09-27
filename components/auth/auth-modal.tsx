"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { LoginForm } from "./login-form"
import { SignupForm } from "./signup-form"
import { EmailVerification } from "./email-verification"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultView?: "login" | "signup"
}

type AuthView = "login" | "signup" | "verification"

export function AuthModal({ isOpen, onClose, defaultView = "login" }: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView)
  const [verificationEmail, setVerificationEmail] = useState("")

  const handleSwitchToSignup = () => setCurrentView("signup")
  const handleSwitchToLogin = () => setCurrentView("login")

  const handleSwitchToVerification = (email: string) => {
    setVerificationEmail(email)
    setCurrentView("verification")
  }

  const handleBackToSignup = () => setCurrentView("signup")

  const handleAuthSuccess = () => {
    onClose()
    // Reset to default view for next time
    setCurrentView(defaultView)
    setVerificationEmail("")
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "login":
        return <LoginForm onSwitchToSignup={handleSwitchToSignup} onSuccess={handleAuthSuccess} />
      case "signup":
        return <SignupForm onSwitchToLogin={handleSwitchToLogin} onSwitchToVerification={handleSwitchToVerification} />
      case "verification":
        return <EmailVerification email={verificationEmail} onSuccess={handleAuthSuccess} onBack={handleBackToSignup} />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">{renderCurrentView()}</DialogContent>
    </Dialog>
  )
}
