import { Address, DeliveryRoute } from "@/types"

export const DEMO_ADDRESSES: Address[] = [
  {
    id: "addr-1",
    address: "123 Market Street, Sydney NSW 2000",
    description: "Loading dock via Kent St",
    dateAdded: new Date().toISOString(),
    timesUsed: 5,
  },
  {
    id: "addr-2",
    address: "55 Collins Street, Melbourne VIC 3000",
    description: "Deliver before 11am",
    dateAdded: new Date().toISOString(),
    timesUsed: 4,
  },
  {
    id: "addr-3",
    address: "88 Adelaide Terrace, Perth WA 6000",
    description: "Call ahead for access",
    dateAdded: new Date().toISOString(),
    timesUsed: 3,
  },
]

export const DEMO_ROUTES: DeliveryRoute[] = [
  {
    id: "route-1",
    name: "Sydney CBD Morning Run",
    addresses: [DEMO_ADDRESSES[0]],
    createdAt: new Date().toISOString(),
    status: "draft",
  },
]
