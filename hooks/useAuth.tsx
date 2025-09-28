"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  isVerified: boolean
  isAdmin?: boolean
  isPremium?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>
  register: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) => Promise<{ success: boolean; message: string; email?: string }>
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; message: string }>
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data for demo purposes
const MOCK_USERS = [
  {
    id: 1,
    email: "demo@dropflow.com",
    password: "demo123",
    firstName: "Demo",
    lastName: "User",
    isVerified: true,
    isAdmin: false,
    isPremium: false,
  },
  {
    id: 2,
    email: "premium@dropflow.com",
    password: "premium123",
    firstName: "Premium",
    lastName: "User",
    isVerified: true,
    isAdmin: false,
    isPremium: true,
  },
]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("dropflow-user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Mock API delay to simulate real API calls
  const mockDelay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

  const checkAuth = async () => {
    // This function is now deprecated. The logic is handled by the useEffect above.
    // It is kept for now to avoid breaking the context signature.
    setIsLoading(true)
    try {
      const storedUser = localStorage.getItem("dropflow-user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (error) {
      console.error("checkAuth failed:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      await mockDelay(800) // Simulate API call delay

      // Find user in mock data
      const mockUser = MOCK_USERS.find((u) => u.email === email && u.password === password)

      if (mockUser) {
        const { password: _, ...userWithoutPassword } = mockUser
        setUser(userWithoutPassword)

        // Store in localStorage to simulate session
        localStorage.setItem("dropflow-user", JSON.stringify(userWithoutPassword))

        return { success: true, message: "Login successful", user: userWithoutPassword }
      }

      return { success: false, message: "Invalid email or password" }
    } catch (error: any) {
      console.error("Login error:", error)
      return {
        success: false,
        message: error.message || "Login failed. Please check your credentials.",
      }
    }
  }

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      await mockDelay(800) // Simulate API call delay

      // Check if user already exists
      const existingUser = MOCK_USERS.find((u) => u.email === email)
      if (existingUser) {
        return {
          success: false,
          message: "User with this email already exists",
        }
      }

      // For demo purposes, we simulate sending an email by logging a code to the console
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      console.log(`[DEMO] Verification code for ${email}: ${verificationCode}`)

      // In a real app, this code would be sent to the user's email.
      // For this demo, we store it in localStorage to be checked by the verifyEmail function.
      localStorage.setItem(`verification-code-${email}`, verificationCode)

      return {
        success: true,
        message: "Registration successful! A verification code has been logged to the console.",
        email: email,
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      return {
        success: false,
        message: error.message || "Registration failed. Please try again.",
      }
    }
  }

  const verifyEmail = async (email: string, code: string) => {
    try {
      await mockDelay(600) // Simulate API call delay

      // Check the stored verification code
      const storedCode = localStorage.getItem(`verification-code-${email}`)

      if (storedCode && storedCode === code) {
        // Create a new verified user
        const newUser = {
          id: Date.now(),
          email,
          firstName: "New",
          lastName: "User",
          isVerified: true,
          isAdmin: false,
          isPremium: false,
        }

        setUser(newUser)
        localStorage.setItem("dropflow-user", JSON.stringify(newUser))
        localStorage.removeItem(`verification-code-${email}`) // Clean up the verification code

        return {
          success: true,
          message: "Email verified successfully",
        }
      }

      return {
        success: false,
        message: "Invalid verification code. Please try again.",
      }
    } catch (error: any) {
      console.error("Email verification error:", error)
      return {
        success: false,
        message: error.message || "Email verification failed. Please try again.",
      }
    }
  }

  const resendVerification = async (email: string) => {
    try {
      await mockDelay(400) // Simulate API call delay

      return {
        success: true,
        message: "Verification code sent to your email",
      }
    } catch (error: any) {
      console.error("Resend verification error:", error)
      return {
        success: false,
        message: error.message || "Failed to resend verification code",
      }
    }
  }

  const logout = async () => {
    try {
      await mockDelay(200) // Simulate API call delay
      localStorage.removeItem("dropflow-user")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
