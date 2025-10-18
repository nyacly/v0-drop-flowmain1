import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Alert } from "react-native"
import { User } from "@/types"

interface StoredUser extends User {
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

interface AuthContextValue {
  user: User | null
  isInitializing: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
}

const USERS_KEY = "dropflow-mobile-users"
const SESSION_KEY = "dropflow-mobile-session"

const DEMO_USERS: StoredUser[] = [
  {
    id: "user-1",
    email: "demo@dropflow.com",
    password: "demo123",
    firstName: "Demo",
    lastName: "Courier",
    isVerified: true,
    isPremium: false,
  },
  {
    id: "user-2",
    email: "premium@dropflow.com",
    password: "premium123",
    firstName: "Premium",
    lastName: "Courier",
    isVerified: true,
    isPremium: true,
  },
]

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<StoredUser[]>(DEMO_USERS)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [storedUsers, storedSession] = await Promise.all([
          AsyncStorage.getItem(USERS_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ])

        if (storedUsers) {
          setUsers(JSON.parse(storedUsers))
        } else {
          await AsyncStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS))
        }

        if (storedSession) {
          const parsed = JSON.parse(storedSession) as User
          setUser(parsed)
        }
      } catch (error) {
        console.warn("Auth bootstrap failed", error)
        setUser(null)
      } finally {
        setIsInitializing(false)
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (!isInitializing) {
      AsyncStorage.setItem(USERS_KEY, JSON.stringify(users)).catch((error) =>
        console.warn("Failed to persist users", error),
      )
    }
  }, [users, isInitializing])

  const persistSession = useCallback((sessionUser: User | null) => {
    if (sessionUser) {
      AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser)).catch((error) =>
        console.warn("Failed to persist session", error),
      )
    } else {
      AsyncStorage.removeItem(SESSION_KEY).catch((error) =>
        console.warn("Failed to clear session", error),
      )
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const normalized = email.trim().toLowerCase()
    const match = users.find((stored) => stored.email === normalized && stored.password === password)

    if (!match) {
      return { success: false, message: "Invalid email or password" }
    }

    const { password: _password, ...safeUser } = match
    setUser(safeUser)
    persistSession(safeUser)
    return { success: true, message: "Signed in" }
  }, [persistSession, users])

  const register = useCallback(async ({ email, password, firstName, lastName }: RegisterPayload) => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    const normalized = email.trim().toLowerCase()
    const exists = users.some((stored) => stored.email === normalized)

    if (exists) {
      return { success: false, message: "An account already exists for this email" }
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      email: normalized,
      password,
      firstName: firstName?.trim() || undefined,
      lastName: lastName?.trim() || undefined,
      isVerified: true,
      isPremium: false,
    }

    setUsers((current) => [...current, newUser])
    const { password: _password, ...safeUser } = newUser
    setUser(safeUser)
    persistSession(safeUser)

    Alert.alert("Account created", "A verified DropFlow account was created locally for demo purposes.")

    return { success: true, message: "Account created" }
  }, [persistSession, users])

  const logout = useCallback(async () => {
    setUser(null)
    persistSession(null)
  }, [persistSession])

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      login,
      register,
      logout,
    }),
    [user, isInitializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}
