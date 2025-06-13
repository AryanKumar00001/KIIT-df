import type React from "react"
import "./globals.css"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import type { Metadata } from "next"
import { ErrorBoundary } from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "KIIT LinkUp",
  description: "Connecting Students, Events, and Opportunities at KIIT",
  generator: "v0.dev",
  keywords: ["KIIT", "students", "community", "networking", "university"],
  authors: [{ name: "KIIT LinkUp Team" }],
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  )
}
