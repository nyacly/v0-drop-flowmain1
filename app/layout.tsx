import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "DropFlow - Smart Delivery Route Optimization",
  description: "Optimize your delivery routes with AI-powered route planning",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DropFlow",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "DropFlow",
    title: "DropFlow - Smart Delivery Route Optimization",
    description: "Optimize your delivery routes with AI-powered route planning",
  },
  twitter: {
    card: "summary",
    title: "DropFlow - Smart Delivery Route Optimization",
    description: "Optimize your delivery routes with AI-powered route planning",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="DropFlow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DropFlow" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />

        <link rel="apple-touch-icon" href="/icon-192.jpg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-192.jpg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icon-192.jpg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/icon-192.jpg" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
