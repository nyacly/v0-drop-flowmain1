"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface EmailVerificationProps {
  email: string
  onSuccess?: () => void
  onBack: () => void
}

export function EmailVerification({ email, onSuccess, onBack }: EmailVerificationProps) {
  const { verifyEmail, resendVerification, isLoading } = useAuth()
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsSubmitting(true)

    try {
      const result = await verifyEmail(email, verificationCode)

      if (result.success) {
        setSuccess("Email verified successfully! Redirecting...")
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    setError("")
    setSuccess("")
    setIsResending(true)

    try {
      const result = await resendVerification(email)

      if (result.success) {
        setSuccess("Verification code sent! Check your email.")
        setResendCooldown(60) // 60 second cooldown
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError("Failed to resend verification code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6)
    setVerificationCode(numericValue)
    if (error) setError("") // Clear error when user starts typing
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
          <Mail className="h-6 w-6" />
          Verify Your Email
        </CardTitle>
        <CardDescription>
          We've sent a 6-digit verification code to
          <br />
          <span className="font-semibold text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground text-center">Enter the 6-digit code from your email</p>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || isLoading || verificationCode.length !== 6}
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResendCode}
              disabled={isResending || resendCooldown > 0}
            >
              {isResending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
            </Button>
          </div>

          <div className="text-center pt-4">
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Sign Up
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
