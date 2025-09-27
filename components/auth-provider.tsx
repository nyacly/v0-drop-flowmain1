"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName: string
  isEmailVerified: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate login - in a real app, this would call your auth API
      const mockUser: User = {
        id: "1",
        email,
        firstName: email.split("@")[0],
        displayName: email.split("@")[0],
        isEmailVerified: true,
      }
      setUser(mockUser)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  const refreshAuth = async () => {
    setIsLoading(true)
    // In a real app, this would check if the user is still authenticated
    setIsLoading(false)
  }

  useEffect(() => {
    // Check if user is already authenticated on mount
    refreshAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
