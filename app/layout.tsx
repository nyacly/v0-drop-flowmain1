import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/hooks/useAuth"
import { Suspense } from "react"
import { AddressesProvider } from "@/hooks/use-addresses"
import GoogleMapsScriptLoader from "@/components/GoogleMapsScriptLoader"
import "./globals.css"

export const metadata: Metadata = {
  title: "DropFlow - Smart Delivery Route Optimization",
  description: "Optimize your delivery routes with AI-powered route planning",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <AddressesProvider>
            <GoogleMapsScriptLoader />
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          </AddressesProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
