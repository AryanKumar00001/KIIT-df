"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getUserConnectionRequests,
  getUserConnections,
  acceptConnectionRequest,
  declineConnectionRequest,
  removeConnection,
  type ConnectionRequest,
  type Connection,
} from "@/lib/connectionService"
import { getUserProfile, type UserProfile } from "@/lib/userService"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Users, UserCheck, UserX, ArrowLeft, Loader2, UserMinus, Clock } from "lucide-react"
import Link from "next/link"

export default function ConnectionsPage() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true)
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setIsAuthenticated(false)
        router.push("/")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Load connection data
  useEffect(() => {
    const loadConnectionData = async () => {
      if (!userProfile) return

      try {
        const [requests, userConnections] = await Promise.all([
          getUserConnectionRequests(userProfile.uid),
          getUserConnections(userProfile.uid),
        ])

        setConnectionRequests(requests)
        setConnections(userConnections)
      } catch (error) {
        console.error("Error loading connection data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadConnectionData()
  }, [userProfile])

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const success = await acceptConnectionRequest(requestId)
      if (success) {
        // Remove from requests and refresh data
        setConnectionRequests((prev) => prev.filter((req) => req.id !== requestId))
        // Refresh connections
        if (userProfile) {
          const userConnections = await getUserConnections(userProfile.uid)
          setConnections(userConnections)
        }
      }
    } catch (error) {
      console.error("Error accepting request:", error)
    }
  }

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const success = await declineConnectionRequest(requestId)
      if (success) {
        setConnectionRequests((prev) => prev.filter((req) => req.id !== requestId))
      }
    } catch (error) {
      console.error("Error declining request:", error)
    }
  }

  const handleRemoveConnection = async (connection: Connection) => {
    try {
      const success = await removeConnection(connection.user1Id, connection.user2Id)
      if (success) {
        setConnections((prev) => prev.filter((conn) => conn.id !== connection.id))
      }
    } catch (error) {
      console.error("Error removing connection:", error)
    }
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading connections...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <img src="/kiitlogo.jpg" alt="KIIT Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-green-400">KIIT LinkUp</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Connections</h1>
          <p className="text-gray-400">Manage your connection requests and existing connections</p>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="requests" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Clock className="h-4 w-4 mr-2" />
              Requests ({connectionRequests.length})
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Connected ({connections.length})
            </TabsTrigger>
          </TabsList>

          {/* Connection Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {connectionRequests.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No pending requests</h3>
                  <p className="text-gray-500">You don't have any connection requests at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {connectionRequests.map((request) => (
                  <Card key={request.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-gray-700">
                            <AvatarImage src={request.fromUserPhoto || "/placeholder.svg"} />
                            <AvatarFallback className="bg-green-600 text-white">
                              {request.fromUserName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-white font-semibold">{request.fromUserName}</h3>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            onClick={() => handleDeclineRequest(request.id)}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            {connections.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No connections yet</h3>
                  <p className="text-gray-500">Start connecting with fellow KIIT students!</p>
                  <Link href="/dashboard/people">
                    <Button className="mt-4 bg-green-600 hover:bg-green-700">Find People</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {connections.map((connection) => {
                  // Determine which user is the "other" user
                  const isUser1 = connection.user1Id === userProfile?.uid
                  const otherUser = {
                    id: isUser1 ? connection.user2Id : connection.user1Id,
                    name: isUser1 ? connection.user2Name : connection.user1Name,
                    photo: isUser1 ? connection.user2Photo : connection.user1Photo,
                  }

                  return (
                    <Card key={connection.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-gray-700">
                              <AvatarImage src={otherUser.photo || "/placeholder.svg"} />
                              <AvatarFallback className="bg-green-600 text-white">
                                {otherUser.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-white font-semibold">{otherUser.name}</h3>
                              {/* Removed the invalid connected date */}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            onClick={() => handleRemoveConnection(connection)}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
