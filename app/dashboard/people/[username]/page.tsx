"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  Instagram,
  Linkedin,
  Github,
  Calendar,
  Users,
  X,
  LogOut,
  Loader2,
  UserX,
  Share2,
  Copy,
  Grid3X3,
  Plus,
  UserCheck,
  Clock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { findUserByUsername, type UserProfile } from "@/lib/userService"
import { INTERESTS_CATEGORIES, SOCIETIES } from "@/lib/constants"
import {
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  getUserConnectionsCount,
} from "@/lib/connectionService"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserPlus, UserMinus } from "lucide-react"

// Define the social links type since it's missing from UserProfile
interface SocialLinks {
  instagram?: string
  linkedin?: string
  github?: string
}

export default function ProfilePage() {
  // ALL HOOKS MUST BE DECLARED FIRST - NO EXCEPTIONS
  const router = useRouter()
  const params = useParams()
  const username = params.username as string

  // All state hooks - always called
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null)
  const [userNotFound, setUserNotFound] = useState(false)
  const [showAvatarPreview, setShowAvatarPreview] = useState(false)
  const [showCoverPhotoPreview, setShowCoverPhotoPreview] = useState(false)
  const [shareProfileOpen, setShareProfileOpen] = useState(false)

  const [connectionsCount, setConnectionsCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<{
    status: "none" | "sent" | "received" | "connected"
    requestId?: string
  }>({ status: "none" })
  const [isProcessingConnection, setIsProcessingConnection] = useState(false)
  const [isLoadingConnectionStatus, setIsLoadingConnectionStatus] = useState(true)

  // All useEffect hooks - always called
  useEffect(() => {
    if (typeof window !== "undefined") {
      const referrer = document.referrer
      if (referrer && referrer.includes(window.location.origin)) {
        sessionStorage.setItem("previousPage", referrer.replace(window.location.origin, ""))
      }
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true)
        setCurrentUser(user)
      } else {
        setIsAuthenticated(false)
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchTargetProfile = async () => {
      if (username) {
        try {
          const userProfile = await findUserByUsername(username)
          if (userProfile) {
            setTargetProfile(userProfile)
            setUserNotFound(false)
          } else {
            setUserNotFound(true)
          }
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUserNotFound(true)
        }
        setIsLoading(false)
      }
    }
    fetchTargetProfile()
  }, [username])

  useEffect(() => {
    const loadConnectionData = async () => {
      if (targetProfile && currentUser) {
        setIsLoadingConnectionStatus(true)
        try {
          const [connectionsCount, status] = await Promise.all([
            getUserConnectionsCount(targetProfile.uid),
            getConnectionStatus(currentUser.uid, targetProfile.uid),
          ])
          setConnectionsCount(connectionsCount)
          setConnectionStatus(status)
        } catch (error) {
          console.error("Error loading connection data:", error)
        } finally {
          setIsLoadingConnectionStatus(false)
        }
      }
    }

    loadConnectionData()
  }, [targetProfile, currentUser])

  // All useCallback hooks - always called
  const handleBackNavigation = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    if (typeof window !== "undefined") {
      const canGoBack = window.history.length > 1

      if (canGoBack) {
        const referrer = document.referrer

        if (referrer && referrer.includes(window.location.origin)) {
          if (referrer.includes("/dashboard")) {
            router.back()
            return
          }
        }

        const previousPage = sessionStorage.getItem("previousPage")
        if (previousPage && previousPage.includes("/dashboard")) {
          router.push(previousPage)
          return
        }
      }

      router.push("/")
    }
  }, [isAuthenticated, router])

  const handleSignOut = useCallback(async () => {
    try {
      await auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [router])

  const handleSignIn = useCallback(() => {
    router.push("/")
  }, [router])

  const handleGoHome = useCallback(() => {
    router.push("/")
  }, [router])

  const handleCopyLink = useCallback(async () => {
    if (!targetProfile) return
    const profileUrl = `${window.location.origin}/dashboard/people/${targetProfile.username}`
    try {
      await navigator.clipboard.writeText(profileUrl)
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }, [targetProfile])

  const generateQRCode = useCallback(() => {
    if (!targetProfile) return ""
    const profileUrl = `${window.location.origin}/dashboard/people/${targetProfile.username}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
  }, [targetProfile])

  const handleConnect = async () => {
    if (!currentUser || !targetProfile) return

    setIsProcessingConnection(true)
    try {
      const success = await sendConnectionRequest(
        currentUser.uid,
        targetProfile.uid,
        currentUser.displayName || "User",
        targetProfile.displayName,
        currentUser.photoURL || undefined,
        targetProfile.photoURL || undefined,
      )

      if (success) {
        setConnectionStatus({ status: "sent" })
      }
    } catch (error) {
      console.error("Error sending connection request:", error)
    }
    setIsProcessingConnection(false)
  }

  const handleCancelRequest = async () => {
    if (!connectionStatus.requestId) return

    setIsProcessingConnection(true)
    try {
      const success = await cancelConnectionRequest(connectionStatus.requestId)
      if (success) {
        setConnectionStatus({ status: "none" })
      }
    } catch (error) {
      console.error("Error canceling connection request:", error)
    }
    setIsProcessingConnection(false)
  }

  const handleAcceptConnection = async () => {
    if (!connectionStatus.requestId) return

    setIsProcessingConnection(true)
    try {
      const success = await acceptConnectionRequest(connectionStatus.requestId)
      if (success) {
        setConnectionStatus({ status: "connected" })
        setConnectionsCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error accepting connection:", error)
    }
    setIsProcessingConnection(false)
  }

  const handleDeclineConnection = async () => {
    if (!connectionStatus.requestId) return

    setIsProcessingConnection(true)
    try {
      const success = await declineConnectionRequest(connectionStatus.requestId)
      if (success) {
        setConnectionStatus({ status: "none" })
      }
    } catch (error) {
      console.error("Error declining connection:", error)
    }
    setIsProcessingConnection(false)
  }

  const handleRemoveConnection = async () => {
    if (!currentUser || !targetProfile) return

    setIsProcessingConnection(true)
    try {
      const success = await removeConnection(currentUser.uid, targetProfile.uid)
      if (success) {
        setConnectionStatus({ status: "none" })
        setConnectionsCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error removing connection:", error)
    }
    setIsProcessingConnection(false)
  }

  // NOW WE CAN DO CONDITIONAL RENDERING - ALL HOOKS HAVE BEEN CALLED

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  // User not found state
  if (userNotFound) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <UserX className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
          <p className="text-gray-400 mb-6">The user @{username} doesn't exist or has deleted their account.</p>
          <Button onClick={handleGoHome} className="bg-green-600 hover:bg-green-700 text-white">
            Go to Home Page
          </Button>
        </div>
      </div>
    )
  }

  // No target profile state
  if (!targetProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Safe access to social links with fallbacks
  const socialLinks: SocialLinks = (targetProfile as any).socialLinks || { instagram: "", linkedin: "", github: "" }

  // Main profile render
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 text-gray-200" onClick={handleBackNavigation}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <img src="/kiitlogo.jpg" alt="KIIT Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-green-400">KIIT LinkUp</span>
              </Link>
            </div>
          </div>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-red-400 hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-green-400 hover:bg-green-500/10"
              onClick={handleSignIn}
            >
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-md mx-auto p-4 space-y-6">
        {/* Profile Header Card */}
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          {/* Cover Photo */}
          <div
            className="h-32 relative bg-cover bg-center cursor-pointer"
            style={{
              backgroundImage: targetProfile.coverPhotoURL
                ? `url(${targetProfile.coverPhotoURL})`
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
            onClick={() => targetProfile.coverPhotoURL && setShowCoverPhotoPreview(true)}
          >
            <div className="absolute top-2 right-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={(e) => {
                  e.stopPropagation()
                  setShareProfileOpen(true)
                }}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
            <div className="absolute -bottom-12 left-4 z-10">
              <div className="relative">
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    if (targetProfile.photoURL) {
                      setShowAvatarPreview(true)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <Avatar className="h-24 w-24 border-4 border-gray-800">
                    <AvatarImage src={targetProfile.photoURL || "/placeholder.svg"} />
                    <AvatarFallback className="bg-green-600 text-white text-2xl">
                      {targetProfile.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-14 pb-5 px-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">{targetProfile.displayName}</h1>
                <p className="text-gray-400">@{targetProfile.username}</p>
                <p className="text-gray-400 mt-1">
                  {targetProfile.branch && targetProfile.semester
                    ? `${targetProfile.branch} • Semester ${targetProfile.semester}`
                    : "Student at KIIT University"}
                </p>
              </div>
            </div>

            {/* Bio */}
            {targetProfile.bio && <p className="text-gray-300 mb-4 leading-relaxed">{targetProfile.bio}</p>}

            {/* Social Links */}
            {(socialLinks.instagram || socialLinks.linkedin || socialLinks.github) && (
              <div className="flex gap-3 mb-6">
                {socialLinks.instagram && (
                  <a
                    href={`https://instagram.com/${socialLinks.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-700 rounded-full text-pink-400 hover:bg-gray-600 transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.linkedin && (
                  <a
                    href={`https://linkedin.com/in/${socialLinks.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-700 rounded-full text-blue-400 hover:bg-gray-600 transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {socialLinks.github && (
                  <a
                    href={`https://github.com/${socialLinks.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-700 rounded-full text-gray-200 hover:bg-gray-600 transition-colors"
                  >
                    <Github className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}

            {/* Connection Button - Only show for authenticated users viewing others */}
            {isAuthenticated && currentUser && targetProfile.uid !== currentUser.uid && (
              <div className="mb-6">
                {isLoadingConnectionStatus ? (
                  <Button variant="outline" className="w-full border-gray-500 bg-gray-700 text-white" disabled>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </Button>
                ) : (
                  <>
                    {connectionStatus.status === "none" && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleConnect}
                        disabled={isProcessingConnection}
                      >
                        {isProcessingConnection ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        Connect
                      </Button>
                    )}

                    {connectionStatus.status === "sent" && (
                      <Button
                        variant="outline"
                        className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                        onClick={handleCancelRequest}
                        disabled={isProcessingConnection}
                      >
                        {isProcessingConnection ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4 mr-2" />
                        )}
                        Cancel Request
                      </Button>
                    )}

                    {connectionStatus.status === "received" && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleAcceptConnection}
                          disabled={isProcessingConnection}
                        >
                          {isProcessingConnection ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4 mr-2" />
                          )}
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          onClick={handleDeclineConnection}
                          disabled={isProcessingConnection}
                        >
                          {isProcessingConnection ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4 mr-2" />
                          )}
                          Decline
                        </Button>
                      </div>
                    )}

                    {connectionStatus.status === "connected" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-green-600 text-green-400 bg-green-600/10"
                          disabled
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Connected
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-red-600 hover:text-white cursor-pointer"
                              onClick={handleRemoveConnection}
                              disabled={isProcessingConnection}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove Connection
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-green-400" />
                  <p className="text-xl font-bold text-white">{connectionsCount}</p>
                </div>
                <p className="text-xs text-gray-400">Connections</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-green-400" />
                  <p className="text-xl font-bold text-white">12</p>
                </div>
                <p className="text-xs text-gray-400">Groups</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-green-400" />
                  <p className="text-xl font-bold text-white">28</p>
                </div>
                <p className="text-xs text-gray-400">Events</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Interests Card */}
        <Card className="bg-gray-800 border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Interests</h3>
          </div>

          {targetProfile.interests && targetProfile.interests.length > 0 ? (
            <div className="space-y-4">
              {/* Group interests by category for display */}
              {Object.entries(INTERESTS_CATEGORIES).map(([category, categoryInterests]) => {
                const userInterestsInCategory =
                  targetProfile.interests?.filter((interest) => categoryInterests.includes(interest)) || []

                if (userInterestsInCategory.length === 0) return null

                return (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-green-400 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {userInterestsInCategory.map((interest, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-600/20 text-green-300 border border-green-600/30"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Show uncategorized interests */}
              {(() => {
                const allCategorizedInterests = Object.values(INTERESTS_CATEGORIES).flat()
                const uncategorizedInterests =
                  targetProfile.interests?.filter((interest) => !allCategorizedInterests.includes(interest)) || []

                if (uncategorizedInterests.length === 0) return null

                return (
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">Other</h4>
                    <div className="flex flex-wrap gap-2">
                      {uncategorizedInterests.map((interest, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-600/20 text-green-300 border border-green-600/30"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-3">No interests added yet</p>
            </div>
          )}
        </Card>

        {/* Joined Societies section */}
        <Card className="bg-gray-800 border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Societies</h3>
          </div>

          {targetProfile.societies && targetProfile.societies.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(SOCIETIES).map(([category, societies]) => {
                const userSocietiesInCategory =
                  targetProfile.societies?.filter((society) => societies.includes(society)) || []

                if (userSocietiesInCategory.length === 0) return null

                return (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-green-400 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {userSocietiesInCategory.map((society, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-600/20 text-green-300 border border-green-600/30"
                        >
                          {society}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 mb-3">No societies joined yet</p>
            </div>
          )}
        </Card>

        {/* Posts Section */}
        <Card className="bg-gray-800 border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Posts</h3>
            {targetProfile.posts && targetProfile.posts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={() => router.push(`/dashboard/people/${targetProfile.username}/posts`)}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {targetProfile.posts && targetProfile.posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {targetProfile.posts.slice(0, 6).map((post, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push(`/dashboard/people/${targetProfile.username}/posts`)}
                >
                  <img
                    src={post || "/placeholder.svg"}
                    alt={`Post ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {targetProfile.posts.length > 6 && (
                <div
                  className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => router.push(`/dashboard/people/${targetProfile.username}/posts`)}
                >
                  <div className="text-center">
                    <Plus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">+{targetProfile.posts.length - 6}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Grid3X3 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-3">No posts yet</p>
              <p className="text-sm text-gray-500">No posts to show</p>
            </div>
          )}
        </Card>

        {/* Join KIIT LinkUp CTA for unauthenticated users */}
        {!isAuthenticated && (
          <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700 p-5 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Join KIIT LinkUp</h3>
            <p className="text-green-100 mb-4">
              Connect with fellow KIIT students, join groups, and discover events based on your interests.
            </p>
            <Button onClick={handleGoHome} className="bg-white text-green-800 hover:bg-gray-100">
              Sign Up Now
            </Button>
          </Card>
        )}
      </main>

      {/* Share Profile Dialog */}
      <Dialog open={shareProfileOpen} onOpenChange={setShareProfileOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Share Profile</DialogTitle>
            <DialogDescription className="text-gray-400">
              Share {targetProfile.displayName}'s profile with others
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Profile Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/dashboard/people/${targetProfile.username}`}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-600" />

            <div className="space-y-2">
              <Label className="text-gray-300">QR Code</Label>
              <div className="flex justify-center">
                <img src={generateQRCode() || "/placeholder.svg"} alt="Profile QR Code" className="rounded-lg" />
              </div>
              <p className="text-xs text-gray-400 text-center">Scan this QR code to view the profile</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600"
              onClick={() => setShareProfileOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Preview Dialog */}
      <Dialog open={showAvatarPreview} onOpenChange={setShowAvatarPreview}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            <img
              src={targetProfile.photoURL || "/placeholder.svg?height=400&width=400"}
              alt="Profile Picture Preview"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
          <DialogFooter className="flex justify-end">
            <Button
              variant="outline"
              className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
              onClick={() => setShowAvatarPreview(false)}
            >
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cover Photo Preview Dialog */}
      <Dialog open={showCoverPhotoPreview} onOpenChange={setShowCoverPhotoPreview}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Cover Photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            <img
              src={targetProfile.coverPhotoURL || ""}
              alt="Cover Photo Preview"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
          <DialogFooter className="flex justify-end">
            <Button
              variant="outline"
              className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
              onClick={() => setShowCoverPhotoPreview(false)}
            >
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
