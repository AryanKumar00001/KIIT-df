"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAllUsers, type UserProfile, calculateYearFromSemester } from "@/lib/userService"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  User,
  UserPlus,
  UserCheck,
  UserX,
  Loader2,
  MoreHorizontal,
  UserMinus,
  Search,
  Filter,
  X,
  Users,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getUserProfile } from "@/lib/userService"
import {
  sendConnectionRequest,
  getConnectionStatus,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  getUserConnectionRequests,
  getUserConnections,
  type ConnectionRequest,
  type Connection,
} from "@/lib/connectionService"

interface FilterState {
  year: string
  branch: string
  society: string
}

const getOrdinalSuffix = (year: number): string => {
  if (year === 1) return "st"
  if (year === 2) return "nd"
  if (year === 3) return "rd"
  return "th"
}

// Extract roll number from email
const extractRollNumber = (email: string): string => {
  return email.split("@")[0] || ""
}

export default function PeoplePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [connectionStatuses, setConnectionStatuses] = useState<{ [key: string]: any }>({})
  const [loadingStatuses, setLoadingStatuses] = useState(true)
  const [processingConnections, setProcessingConnections] = useState<{ [key: string]: boolean }>({})

  // Navigation state
  const [activeTab, setActiveTab] = useState("all-people")

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [filters, setFilters] = useState<FilterState>({
    year: "",
    branch: "",
    society: "",
  })
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  // Search and filter states for connections and requests
  const [connectionsSearchQuery, setConnectionsSearchQuery] = useState("")
  const [requestsSearchQuery, setRequestsSearchQuery] = useState("")
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ConnectionRequest[]>([])

  // Get unique values for filter options
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [availableBranches, setAvailableBranches] = useState<string[]>([])
  const [availableSocieties, setAvailableSocieties] = useState<string[]>([])

  // Store current page in session storage for back navigation
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("previousPage", "/dashboard/people")
    }
  }, [])

  // Check authentication status
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
        router.push("/")
      }
    })

    return () => unsubscribe()
  }, [router])

  // Fetch users and connection data
  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return

      try {
        const [fetchedUsers, requests, userConnections] = await Promise.all([
          getAllUsers(),
          getUserConnectionRequests(userProfile.uid),
          getUserConnections(userProfile.uid),
        ])

        // Filter out the current user from the list
        const filteredUsers = fetchedUsers.filter((user) => user.uid !== userProfile.uid)

        setUsers(filteredUsers)
        setConnectionRequests(requests)
        setConnections(userConnections)

        // Extract unique filter options
        const years = [
          ...new Set(
            filteredUsers.filter((user) => user.semester).map((user) => calculateYearFromSemester(user.semester!)),
          ),
        ].sort()

        const branches = [...new Set(filteredUsers.filter((user) => user.branch).map((user) => user.branch!))].sort()

        const societies = [
          ...new Set(
            filteredUsers
              .filter((user) => user.societies && user.societies.length > 0)
              .flatMap((user) => user.societies!),
          ),
        ].sort()

        setAvailableYears(years)
        setAvailableBranches(branches)
        setAvailableSocieties(societies)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated && userProfile) {
      fetchData()
    }
  }, [isAuthenticated, userProfile])

  // Apply search and filters
  useEffect(() => {
    if (users.length > 0) {
      let filtered = users

      // Apply search filter
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().trim()
        filtered = filtered.filter((user) => {
          const rollNumber = extractRollNumber(user.email).toLowerCase()
          return (
            user.displayName?.toLowerCase().includes(searchLower) ||
            user.username?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower) ||
            rollNumber.includes(searchLower) ||
            user.branch?.toLowerCase().includes(searchLower)
          )
        })
      }

      // Apply year filter
      if (filters.year) {
        const targetYear = Number.parseInt(filters.year)
        filtered = filtered.filter((user) => user.semester && calculateYearFromSemester(user.semester) === targetYear)
      }

      // Apply branch filter
      if (filters.branch) {
        filtered = filtered.filter((user) => user.branch === filters.branch)
      }

      // Apply society filter
      if (filters.society) {
        filtered = filtered.filter((user) => user.societies && user.societies.includes(filters.society))
      }

      setFilteredUsers(filtered)
    }
  }, [searchQuery, filters, users])

  // Filter connections based on search
  useEffect(() => {
    if (connections.length > 0) {
      let filtered = connections

      if (connectionsSearchQuery.trim()) {
        const searchLower = connectionsSearchQuery.toLowerCase().trim()
        filtered = filtered.filter((connection) => {
          const isUser1 = connection.user1Id === userProfile?.uid
          const otherUserName = isUser1 ? connection.user2Name : connection.user1Name
          return otherUserName.toLowerCase().includes(searchLower)
        })
      }

      setFilteredConnections(filtered)
    } else {
      setFilteredConnections([])
    }
  }, [connectionsSearchQuery, connections, userProfile])

  // Filter requests based on search
  useEffect(() => {
    if (connectionRequests.length > 0) {
      let filtered = connectionRequests

      if (requestsSearchQuery.trim()) {
        const searchLower = requestsSearchQuery.toLowerCase().trim()
        filtered = filtered.filter((request) => {
          return request.fromUserName.toLowerCase().includes(searchLower)
        })
      }

      setFilteredRequests(filtered)
    } else {
      setFilteredRequests([])
    }
  }, [requestsSearchQuery, connectionRequests])

  // Count active filters
  useEffect(() => {
    const count = Object.values(filters).filter((value) => value !== "").length
    setActiveFiltersCount(count)
  }, [filters])

  const handleConnect = useCallback(
    async (targetUserId: string, targetUser: UserProfile, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!userProfile) return

      setProcessingConnections((prev) => ({ ...prev, [targetUserId]: true }))

      try {
        const connectionStatus = await getConnectionStatus(userProfile.uid, targetUserId)

        switch (connectionStatus.status) {
          case "none":
            const success = await sendConnectionRequest(
              userProfile.uid,
              targetUserId,
              userProfile.displayName,
              targetUser.displayName,
              userProfile.photoURL,
              targetUser.photoURL,
            )
            if (success) {
              setConnectionStatuses((prev) => ({
                ...prev,
                [targetUserId]: { status: "sent" },
              }))
            }
            break

          case "received":
            if (connectionStatus.requestId) {
              const accepted = await acceptConnectionRequest(connectionStatus.requestId)
              if (accepted) {
                setConnectionStatuses((prev) => ({
                  ...prev,
                  [targetUserId]: { status: "connected" },
                }))
                // Refresh connection data
                const [requests, userConnections] = await Promise.all([
                  getUserConnectionRequests(userProfile.uid),
                  getUserConnections(userProfile.uid),
                ])
                setConnectionRequests(requests)
                setConnections(userConnections)
              }
            }
            break

          case "sent":
            if (connectionStatus.requestId) {
              const canceled = await cancelConnectionRequest(connectionStatus.requestId)
              if (canceled) {
                setConnectionStatuses((prev) => ({
                  ...prev,
                  [targetUserId]: { status: "none" },
                }))
              }
            }
            break
        }
      } catch (error) {
        console.error("Error handling connection:", error)
      } finally {
        setProcessingConnections((prev) => ({ ...prev, [targetUserId]: false }))
      }
    },
    [userProfile],
  )

  const handleRemoveConnection = useCallback(
    async (targetUserId: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!userProfile) return

      setProcessingConnections((prev) => ({ ...prev, [targetUserId]: true }))

      try {
        const removed = await removeConnection(userProfile.uid, targetUserId)
        if (removed) {
          setConnectionStatuses((prev) => ({
            ...prev,
            [targetUserId]: { status: "none" },
          }))
          // Refresh connection data
          const userConnections = await getUserConnections(userProfile.uid)
          setConnections(userConnections)
        }
      } catch (error) {
        console.error("Error removing connection:", error)
      } finally {
        setProcessingConnections((prev) => ({ ...prev, [targetUserId]: false }))
      }
    },
    [userProfile],
  )

  const handleDecline = useCallback(
    async (targetUserId: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!userProfile) return

      setProcessingConnections((prev) => ({ ...prev, [targetUserId]: true }))

      try {
        const connectionStatus = await getConnectionStatus(userProfile.uid, targetUserId)
        if (connectionStatus.status === "received" && connectionStatus.requestId) {
          const declined = await declineConnectionRequest(connectionStatus.requestId)
          if (declined) {
            setConnectionStatuses((prev) => ({
              ...prev,
              [targetUserId]: { status: "none" },
            }))
            // Refresh requests
            const requests = await getUserConnectionRequests(userProfile.uid)
            setConnectionRequests(requests)
          }
        }
      } catch (error) {
        console.error("Error declining connection:", error)
      } finally {
        setProcessingConnections((prev) => ({ ...prev, [targetUserId]: false }))
      }
    },
    [userProfile],
  )

  const handleCardClick = useCallback((username: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("previousPage", "/dashboard/people")
      window.location.href = `/dashboard/people/${username}`
    }
  }, [])

  const clearFilters = () => {
    setFilters({
      year: "",
      branch: "",
      society: "",
    })
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const clearConnectionsSearch = () => {
    setConnectionsSearchQuery("")
  }

  const clearRequestsSearch = () => {
    setRequestsSearchQuery("")
  }

  // Load connection statuses for all users
  useEffect(() => {
    const loadConnectionStatuses = async () => {
      if (!userProfile || users.length === 0) return

      setLoadingStatuses(true)
      const statuses: { [key: string]: any } = {}

      for (const user of users) {
        if (user.uid !== userProfile.uid) {
          const status = await getConnectionStatus(userProfile.uid, user.uid)
          statuses[user.uid] = status
        }
      }

      setConnectionStatuses(statuses)
      setLoadingStatuses(false)
    }

    loadConnectionStatuses()
  }, [userProfile, users])

  if (!isAuthenticated) {
    return null
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6 space-y-4">
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-10 w-full" />
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 w-full sm:w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex bg-gray-800 border-gray-700 mb-6">
          <TabsTrigger
            value="all-people"
            className="flex-1 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 px-1 sm:px-3 py-2 text-xs sm:text-sm"
          >
            <Users className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">All People</span>
            <span className="xs:hidden">People</span>
          </TabsTrigger>
          <TabsTrigger
            value="connections"
            className="flex-1 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 px-1 sm:px-3 py-2 text-xs sm:text-sm"
          >
            <UserCheck className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">My Connections</span>
            <span className="xs:hidden">Connections</span>
            <span className="ml-1">({connections.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="flex-1 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 px-1 sm:px-3 py-2 text-xs sm:text-sm"
          >
            <Clock className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Requests</span>
            <span className="ml-1">({connectionRequests.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* All People Tab */}
        <TabsContent value="all-people" className="space-y-6">
          {/* Search and Filter Section */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, username, email, or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Filter Button */}
              <div className="flex items-center gap-3">
                <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors h-10"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-green-600 text-white text-xs px-1.5 py-0.5">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-white text-lg font-semibold">Filter People</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-3 block">Year</label>
                        <Select
                          value={filters.year}
                          onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, year: value === "all" ? "" : value }))
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 focus:ring-green-500 focus:border-green-500">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="all" className="text-white hover:bg-gray-700">
                              All Years
                            </SelectItem>
                            {availableYears.map((year) => (
                              <SelectItem key={year} value={year.toString()} className="text-white hover:bg-gray-700">
                                {year}
                                {getOrdinalSuffix(year)} Year
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-3 block">Branch</label>
                        <Select
                          value={filters.branch}
                          onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, branch: value === "all" ? "" : value }))
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 focus:ring-green-500 focus:border-green-500">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="all" className="text-white hover:bg-gray-700">
                              All Branches
                            </SelectItem>
                            {availableBranches.map((branch) => (
                              <SelectItem key={branch} value={branch} className="text-white hover:bg-gray-700">
                                {branch}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-3 block">Society</label>
                        <Select
                          value={filters.society}
                          onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, society: value === "all" ? "" : value }))
                          }
                        >
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 focus:ring-green-500 focus:border-green-500">
                            <SelectValue placeholder="Select society" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            <SelectItem value="all" className="text-white hover:bg-gray-700">
                              All Societies
                            </SelectItem>
                            {availableSocieties.map((society) => (
                              <SelectItem key={society} value={society} className="text-white hover:bg-gray-700">
                                {society}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
                        <Button
                          onClick={clearFilters}
                          variant="outline"
                          className="flex-1 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
                        >
                          Clear All
                        </Button>
                        <Button
                          onClick={() => setIsFilterDialogOpen(false)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Clear All Filters Button - Mobile Only */}
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="sm:hidden bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Active Filter Tags - Responsive */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {filters.year && (
                    <Badge
                      variant="secondary"
                      className="bg-green-600/20 text-green-400 border border-green-600/30 px-3 py-1"
                    >
                      {filters.year}
                      {getOrdinalSuffix(Number.parseInt(filters.year))} Year
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters((prev) => ({ ...prev, year: "" }))}
                        className="ml-2 h-4 w-4 p-0 text-green-400 hover:text-green-300 hover:bg-green-600/30"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.branch && (
                    <Badge
                      variant="secondary"
                      className="bg-green-600/20 text-green-400 border border-green-600/30 px-3 py-1"
                    >
                      {filters.branch}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters((prev) => ({ ...prev, branch: "" }))}
                        className="ml-2 h-4 w-4 p-0 text-green-400 hover:text-green-300 hover:bg-green-600/30"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filters.society && (
                    <Badge
                      variant="secondary"
                      className="bg-green-600/20 text-green-400 border border-green-600/30 px-3 py-1"
                    >
                      {filters.society}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters((prev) => ({ ...prev, society: "" }))}
                        className="ml-2 h-4 w-4 p-0 text-green-400 hover:text-green-300 hover:bg-green-600/30"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">
              {searchQuery || activeFiltersCount > 0 ? "Filtered Results" : "All People"}
            </h2>
            <p className="text-gray-400 text-sm">
              {filteredUsers.length} {filteredUsers.length === 1 ? "person" : "people"} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>

          {/* People Grid */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No people found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4 px-4">
                {searchQuery || activeFiltersCount > 0
                  ? "Try adjusting your search terms or filters"
                  : "Check back later for new members joining the community"}
              </p>
              {(searchQuery || activeFiltersCount > 0) && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={clearSearch}
                      className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
                    >
                      Clear Search
                    </Button>
                  )}
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredUsers.map((user) => {
                const status = connectionStatuses[user.uid]?.status || "none"
                const isProcessing = processingConnections[user.uid] || false
                const isStatusLoading = loadingStatuses

                return (
                  <div key={user.uid} className="group">
                    <Card
                      className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-all duration-300 h-full group-hover:shadow-lg group-hover:shadow-green-500/10 cursor-pointer"
                      onClick={() => handleCardClick(user.username)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-gray-700 group-hover:border-green-500/50 transition-colors">
                            <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName} />
                            <AvatarFallback className="bg-green-600 text-white text-sm font-medium">
                              {user.displayName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-white text-base font-semibold truncate group-hover:text-green-400 transition-colors">
                              {user.displayName}
                            </CardTitle>
                            <CardDescription className="text-green-400 font-medium text-sm truncate">
                              @{user.username}
                            </CardDescription>
                            <CardDescription className="text-gray-500 text-xs truncate">
                              {extractRollNumber(user.email)}
                            </CardDescription>
                          </div>
                        </div>
                        {user.semester && user.branch && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-xs text-gray-400">
                              {calculateYearFromSemester(user.semester)}
                              {getOrdinalSuffix(calculateYearFromSemester(user.semester))} Year • {user.branch}
                            </p>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        {status === "received" ? (
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all"
                              onClick={(e) => handleConnect(user.uid, user, e)}
                              disabled={isProcessing || isStatusLoading}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <UserCheck className="h-4 w-4 mr-2" />
                              )}
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-sm font-medium transition-all"
                              onClick={(e) => handleDecline(user.uid, e)}
                              disabled={isProcessing || isStatusLoading}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <UserX className="h-4 w-4 mr-2" />
                              )}
                              Decline
                            </Button>
                          </div>
                        ) : status === "connected" ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 border-green-600 text-green-400 bg-green-600/10 cursor-default"
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
                                  onClick={(e) => handleRemoveConnection(user.uid, e)}
                                  disabled={isProcessing}
                                >
                                  <UserMinus className="h-4 w-4 mr-2" />
                                  Remove Connection
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <Button
                            className={`w-full text-sm font-medium transition-all ${(() => {
                              if (isStatusLoading) {
                                return "bg-gray-600 text-gray-300"
                              }
                              switch (status) {
                                case "sent":
                                  return "bg-yellow-600 hover:bg-yellow-700 text-white"
                                default:
                                  return "bg-green-600 hover:bg-green-700 text-white group-hover:bg-green-500"
                              }
                            })()}`}
                            onClick={(e) => handleConnect(user.uid, user, e)}
                            disabled={isProcessing || isStatusLoading}
                          >
                            {isProcessing || isStatusLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            {(() => {
                              if (isStatusLoading) {
                                return "Loading..."
                              }
                              switch (status) {
                                case "sent":
                                  return "Cancel Request"
                                default:
                                  return "Connect"
                              }
                            })()}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* My Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          {/* Search Bar for Connections */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search connections by name..."
              value={connectionsSearchQuery}
              onChange={(e) => setConnectionsSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12"
            />
            {connectionsSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearConnectionsSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">
              {connectionsSearchQuery ? "Filtered Connections" : "My Connections"}
            </h2>
            <p className="text-gray-400 text-sm">
              {filteredConnections.length} {filteredConnections.length === 1 ? "connection" : "connections"}
              {connectionsSearchQuery && ` found for "${connectionsSearchQuery}"`}
            </p>
          </div>

          {filteredConnections.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                {connectionsSearchQuery ? "No connections found" : "No connections yet"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                {connectionsSearchQuery
                  ? `No connections match "${connectionsSearchQuery}"`
                  : "Start connecting with fellow KIIT students!"}
              </p>
              {connectionsSearchQuery ? (
                <Button
                  variant="outline"
                  onClick={clearConnectionsSearch}
                  className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
                >
                  Clear Search
                </Button>
              ) : (
                <Button
                  onClick={() => setActiveTab("all-people")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Find People
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredConnections.map((connection) => {
                // Determine which user is the "other" user
                const isUser1 = connection.user1Id === userProfile?.uid
                const otherUser = {
                  id: isUser1 ? connection.user2Id : connection.user1Id,
                  name: isUser1 ? connection.user2Name : connection.user1Name,
                  photo: isUser1 ? connection.user2Photo : connection.user1Photo,
                }

                return (
                  <Card key={connection.id} className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-gray-700">
                          <AvatarImage src={otherUser.photo || "/placeholder.svg"} alt={otherUser.name} />
                          <AvatarFallback className="bg-green-600 text-white text-sm font-medium">
                            {otherUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white text-base font-semibold truncate">
                            {otherUser.name}
                          </CardTitle>
                          {/* Removed the invalid date display */}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button
                        variant="outline"
                        className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        onClick={(e) => handleRemoveConnection(otherUser.id, e)}
                        disabled={processingConnections[otherUser.id]}
                      >
                        {processingConnections[otherUser.id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4 mr-2" />
                        )}
                        Remove Connection
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Connection Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Search Bar for Requests */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search requests by name..."
              value={requestsSearchQuery}
              onChange={(e) => setRequestsSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12"
            />
            {requestsSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRequestsSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-1">
              {requestsSearchQuery ? "Filtered Requests" : "Connection Requests"}
            </h2>
            <p className="text-gray-400 text-sm">
              {filteredRequests.length} pending {filteredRequests.length === 1 ? "request" : "requests"}
              {requestsSearchQuery && ` found for "${requestsSearchQuery}"`}
            </p>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                {requestsSearchQuery ? "No requests found" : "No pending requests"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                {requestsSearchQuery
                  ? `No requests match "${requestsSearchQuery}"`
                  : "You don't have any connection requests at the moment."}
              </p>
              {requestsSearchQuery && (
                <Button
                  variant="outline"
                  onClick={clearRequestsSearch}
                  className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-gray-700">
                          <AvatarImage src={request.fromUserPhoto || "/placeholder.svg"} alt={request.fromUserName} />
                          <AvatarFallback className="bg-green-600 text-white">
                            {request.fromUserName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-white font-semibold">{request.fromUserName}</h3>
                          {/* Removed the invalid date display */}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleConnect(request.fromUserId, { uid: request.fromUserId } as UserProfile, e)
                          }}
                          disabled={processingConnections[request.fromUserId]}
                        >
                          {processingConnections[request.fromUserId] ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4 mr-1" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDecline(request.fromUserId, e)
                          }}
                          disabled={processingConnections[request.fromUserId]}
                        >
                          {processingConnections[request.fromUserId] ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4 mr-1" />
                          )}
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
      </Tabs>
    </div>
  )
}
