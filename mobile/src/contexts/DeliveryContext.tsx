import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Address, DeliveryRoute, DeliveryStop, StopStatus } from "@/types"
import { DEMO_ADDRESSES, DEMO_ROUTES } from "@/constants/demo"

interface DeliveryContextValue {
  isReady: boolean
  addresses: Address[]
  routes: DeliveryRoute[]
  activeRoute: DeliveryRoute | null
  activeStops: DeliveryStop[]
  addAddress: (payload: { address: string; description?: string }) => Promise<void>
  removeAddress: (addressId: string) => Promise<void>
  createRoute: (payload: { name: string; addressIds: string[] }) => Promise<void>
  deleteRoute: (routeId: string) => Promise<void>
  startRoute: (routeId: string) => Promise<void>
  updateStopStatus: (stopId: string, status: StopStatus, notes?: string) => Promise<void>
  reorderStops: (fromIndex: number, toIndex: number) => void
  completeRoute: () => Promise<void>
  resetDemoData: () => Promise<void>
}

interface PersistedState {
  addresses: Address[]
  routes: DeliveryRoute[]
  activeRouteId: string | null
  activeStops: DeliveryStop[]
}

const STORAGE_KEY = "dropflow-mobile-delivery"

const DeliveryContext = createContext<DeliveryContextValue | null>(null)

const generateDemoState = (): PersistedState => {
  const now = Date.now()
  const addresses: Address[] = DEMO_ADDRESSES.map((address, index) => ({
    ...address,
    id: `${address.id}-${now}-${index}`,
    dateAdded: new Date().toISOString(),
  }))
  const addressLookup = new Map(DEMO_ADDRESSES.map((address, index) => [address.id, addresses[index]]))
  const routes: DeliveryRoute[] = DEMO_ROUTES.map((route, index) => ({
    ...route,
    id: `${route.id}-${now}-${index}`,
    createdAt: new Date().toISOString(),
    status: "draft",
    addresses: route.addresses
      .map((addr) => addressLookup.get(addr.id))
      .filter((addr): addr is Address => Boolean(addr)),
  }))
  return {
    addresses,
    routes,
    activeRouteId: null,
    activeStops: [],
  }
}

export const DeliveryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(() => ({ addresses: [], routes: [], activeRouteId: null, activeStops: [] }))
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as PersistedState
          setState(parsed)
        } else {
          const demo = generateDemoState()
          setState(demo)
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(demo))
        }
      } catch (error) {
        console.warn("Failed to load delivery state", error)
        setState(generateDemoState())
      } finally {
        setIsReady(true)
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (isReady) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) =>
        console.warn("Failed to persist delivery state", error),
      )
    }
  }, [state, isReady])

  const activeRoute = useMemo(
    () => (state.activeRouteId ? state.routes.find((route) => route.id === state.activeRouteId) ?? null : null),
    [state.routes, state.activeRouteId],
  )

  const addAddress = useCallback(async ({ address, description }: { address: string; description?: string }) => {
    setState((current) => {
      const newAddress: Address = {
        id: `addr-${Date.now()}`,
        address,
        description: description?.trim() || undefined,
        dateAdded: new Date().toISOString(),
        timesUsed: 0,
      }
      return {
        ...current,
        addresses: [newAddress, ...current.addresses],
      }
    })
  }, [])

  const removeAddress = useCallback(async (addressId: string) => {
    setState((current) => {
      const addresses = current.addresses.filter((address) => address.id !== addressId)
      const routes = current.routes.map((route) => ({
        ...route,
        addresses: route.addresses.filter((address) => address.id !== addressId),
        status: route.addresses.filter((address) => address.id !== addressId).length === 0 ? "draft" : route.status,
      }))
      const activeStops = current.activeStops.filter((stop) => stop.addressId !== addressId)
      const activeRouteId = activeStops.length > 0 ? current.activeRouteId : null
      return {
        addresses,
        routes,
        activeStops,
        activeRouteId,
      }
    })
  }, [])

  const createRoute = useCallback(async ({ name, addressIds }: { name: string; addressIds: string[] }) => {
    setState((current) => {
      const selected = addressIds
        .map((id) => current.addresses.find((address) => address.id === id))
        .filter((address): address is Address => Boolean(address))

      if (selected.length === 0) {
        return current
      }

      const newRoute: DeliveryRoute = {
        id: `route-${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        status: "draft",
        addresses: selected.map((address) => ({ ...address })),
      }

      return {
        ...current,
        routes: [newRoute, ...current.routes],
      }
    })
  }, [])

  const deleteRoute = useCallback(async (routeId: string) => {
    setState((current) => {
      const routes = current.routes.filter((route) => route.id !== routeId)
      const isActive = current.activeRouteId === routeId
      return {
        ...current,
        routes,
        activeRouteId: isActive ? null : current.activeRouteId,
        activeStops: isActive ? [] : current.activeStops,
      }
    })
  }, [])

  const startRoute = useCallback(async (routeId: string) => {
    setState((current) => {
      const target = current.routes.find((route) => route.id === routeId)
      if (!target || target.addresses.length === 0) {
        return current
      }

      const stops: DeliveryStop[] = target.addresses.map((address, index) => ({
        id: `${routeId}-${address.id}-${index}`,
        addressId: address.id,
        address: address.address,
        status: "pending",
        notes: undefined,
      }))

      const routes = current.routes.map((route) =>
        route.id === routeId
          ? { ...route, status: "active" }
          : route.status === "active"
            ? { ...route, status: "draft" }
            : route,
      )

      const addresses = current.addresses.map((address) =>
        target.addresses.some((selected) => selected.id === address.id)
          ? { ...address, timesUsed: address.timesUsed + 1 }
          : address,
      )

      return {
        addresses,
        routes,
        activeRouteId: routeId,
        activeStops: stops,
      }
    })
  }, [])

  const updateStopStatus = useCallback(async (stopId: string, status: StopStatus, notes?: string) => {
    setState((current) => {
      const activeStops = current.activeStops.map((stop) =>
        stop.id === stopId
          ? {
              ...stop,
              status,
              notes: notes ?? stop.notes,
            }
          : stop,
      )

      const allCompleted = activeStops.length > 0 && activeStops.every((stop) => stop.status === "completed")
      const routes = allCompleted && current.activeRouteId
        ? current.routes.map((route) =>
            route.id === current.activeRouteId ? { ...route, status: "completed" } : route,
          )
        : current.routes

      return {
        ...current,
        activeStops,
        routes,
      }
    })
  }, [])

  const reorderStops = useCallback((fromIndex: number, toIndex: number) => {
    setState((current) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.activeStops.length ||
        toIndex >= current.activeStops.length
      ) {
        return current
      }

      const updated = [...current.activeStops]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)

      return {
        ...current,
        activeStops: updated,
      }
    })
  }, [])

  const completeRoute = useCallback(async () => {
    setState((current) => {
      if (!current.activeRouteId) {
        return current
      }

      const routes = current.routes.map((route) =>
        route.id === current.activeRouteId ? { ...route, status: "completed" } : route,
      )

      return {
        ...current,
        routes,
        activeRouteId: null,
        activeStops: [],
      }
    })
  }, [])

  const resetDemoData = useCallback(async () => {
    const demo = generateDemoState()
    setState(demo)
  }, [])

  const value = useMemo(
    () => ({
      isReady,
      addresses: state.addresses,
      routes: state.routes,
      activeRoute,
      activeStops: state.activeStops,
      addAddress,
      removeAddress,
      createRoute,
      deleteRoute,
      startRoute,
      updateStopStatus,
      reorderStops,
      completeRoute,
      resetDemoData,
    }),
    [
      isReady,
      state.addresses,
      state.routes,
      state.activeStops,
      activeRoute,
      addAddress,
      removeAddress,
      createRoute,
      deleteRoute,
      startRoute,
      updateStopStatus,
      reorderStops,
      completeRoute,
      resetDemoData,
    ],
  )

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>
}

export const useDeliveryContext = () => {
  const context = useContext(DeliveryContext)
  if (!context) {
    throw new Error("useDeliveryContext must be used within DeliveryProvider")
  }
  return context
}
