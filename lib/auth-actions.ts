export async function getCurrentUser() {
  return null
}

export async function signOut() {
  // Mock sign out - no actual action needed
}

export async function getAuthStatus() {
  return {
    isAuthenticated: false,
    user: null,
  }
}
