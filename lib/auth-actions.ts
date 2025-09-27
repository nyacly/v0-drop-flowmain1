"use server"

import { stackServerApp } from "./stack-server"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
  try {
    const user = await stackServerApp.getUser()
    return user
      ? {
          id: user.id,
          email: user.primaryEmail,
          displayName: user.displayName,
          isEmailVerified: user.primaryEmailVerified,
        }
      : null
  } catch (error) {
    return null
  }
}

export async function signOut() {
  try {
    await stackServerApp.signOut()
    redirect("/")
  } catch (error) {
    console.error("Sign out error:", error)
  }
}

export async function getAuthStatus() {
  try {
    const user = await stackServerApp.getUser()
    return {
      isAuthenticated: !!user,
      user: user
        ? {
            id: user.id,
            email: user.primaryEmail,
            displayName: user.displayName,
            isEmailVerified: user.primaryEmailVerified,
          }
        : null,
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
    }
  }
}
