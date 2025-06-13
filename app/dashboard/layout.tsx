"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Check if the current path is a public profile page
  const isPublicProfilePage = pathname?.startsWith("/dashboard/people/") && pathname !== "/dashboard/people"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
      setHasCheckedAuth(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Only redirect after we've checked auth and it's not a public profile page
    if (hasCheckedAuth && !isLoading && !isAuthenticated && !isPublicProfilePage) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router, isPublicProfilePage, hasCheckedAuth])

  // Always render a consistent structure
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Always render children - let individual pages handle their own auth logic
  return <>{children}</>
}
