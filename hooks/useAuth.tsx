"use client"

import { useAuth as useAuthProvider } from "@/components/auth-provider"

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  isVerified: boolean
  isAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean // Added missing isAuthenticated property
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

export const useAuth = (): AuthContextType => {
  const {
    user: authUser,
    isAuthenticated,
    isLoading,
    refreshAuth,
    login: authLogin,
    logout: authLogout,
  } = useAuthProvider()

  // Convert auth user to legacy User interface for compatibility
  const user: User | null = authUser
    ? {
        id: authUser.id,
        email: authUser.email,
        firstName: authUser.displayName?.split(" ")[0],
        lastName: authUser.displayName?.split(" ").slice(1).join(" "),
        isVerified: authUser.isEmailVerified,
        isAdmin: false,
      }
    : null

  const login = async (email: string, password: string) => {
    try {
      await authLogin(email, password)
      return { success: true, message: "Login successful", user }
    } catch (error) {
      return { success: false, message: "Login failed" }
    }
  }

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    // Redirect to Stack Auth sign-up page
    window.location.href = "/handler/signup"
    return {
      success: true,
      message: "Redirecting to registration...",
      email,
    }
  }

  const verifyEmail = async (email: string, code: string) => {
    return {
      success: true,
      message: "Email verification handled by Stack Auth",
    }
  }

  const resendVerification = async (email: string) => {
    return {
      success: true,
      message: "Verification email resend handled by Stack Auth",
    }
  }

  const logout = async () => {
    try {
      authLogout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const checkAuth = async () => {
    await refreshAuth()
  }

  return {
    user,
    isLoading,
    isAuthenticated, // Return the isAuthenticated property
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    checkAuth,
  }
}
