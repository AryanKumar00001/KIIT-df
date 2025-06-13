"use client"

import type React from "react"
import { useEffect, useState, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, UserPlus, Mail, Bell, Settings, LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { getUserProfile, type UserProfile } from "@/lib/userService"

export default function PeopleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true)
        try {
          const profile = await getUserProfile(user.uid)
          setUserProfile(profile)
        } catch (error) {
          console.error("Error fetching user profile:", error)
        }
      } else {
        setIsAuthenticated(false)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Check if the current path is an individual profile page
  const isIndividualProfilePage = pathname !== "/dashboard/people" && pathname?.startsWith("/dashboard/people/")

  // For individual profile pages, don't show the layout wrapper - just render children
  if (isIndividualProfilePage) {
    return <>{children}</>
  }

  // For the people listing page, require authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isIndividualProfilePage) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router, isIndividualProfilePage])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render layout for unauthenticated users on listing page
  if (!isAuthenticated) {
    return null
  }

  const user = {
    name: auth.currentUser?.displayName || "User",
    email: auth.currentUser?.email || "user@kiit.ac.in",
    avatar: userProfile?.photoURL || "/placeholder.svg?height=40&width=40",
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim())
    }
    router.push(`/dashboard/people?${params.toString()}`)
  }

  const clearSearch = () => {
    setSearchQuery("")
    router.push("/dashboard/people")
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <img src="/kiitlogo.jpg" alt="KIIT Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-green-400">KIIT LinkUp</span>
              </Link>
              <div className="hidden md:block">
                <nav className="flex items-center space-x-1 text-sm">
                  <Link href="/dashboard" className="text-gray-400 hover:text-white">
                    Dashboard
                  </Link>
                  <span className="text-gray-500">/</span>
                  <span className="text-green-400 font-medium">People</span>
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer border-2 border-green-500">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback className="bg-green-600 text-white">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Account Menu</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-700">
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-gray-700"
                      onClick={() => console.log("Settings")}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-400 hover:bg-gray-700"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="container mx-auto max-w-7xl">
          <Suspense fallback={<div>Loading...</div>}>
            <form onSubmit={handleSearch} className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search people by name, username, or branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  Clear
                </Button>
              )}
            </form>
          </Suspense>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto max-w-7xl px-4">
          <nav className="flex">
            <Link
              href="/dashboard/people"
              className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                pathname === "/dashboard/people"
                  ? "border-green-500 text-green-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <Users className="h-4 w-4" />
              All People
            </Link>
            <Link
              href="/dashboard/people/connections"
              className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                pathname === "/dashboard/people/connections"
                  ? "border-green-500 text-green-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <UserPlus className="h-4 w-4" />
              My Connections
            </Link>
            <Link
              href="/dashboard/people/requests"
              className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                pathname === "/dashboard/people/requests"
                  ? "border-green-500 text-green-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <Mail className="h-4 w-4" />
              Requests
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto max-w-7xl">{children}</main>
    </div>
  )
}
