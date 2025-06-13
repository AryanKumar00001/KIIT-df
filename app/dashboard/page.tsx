"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Bell, Search, Plus, Users, Calendar, Settings, User, LogOut, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getUserProfile } from "@/lib/userService"

export default function DashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [createEventOpen, setCreateEventOpen] = useState(false)
  const [joinedGroups, setJoinedGroups] = useState<number[]>([])
  const [joinedEvents, setJoinedEvents] = useState<number[]>([])
  const [connectedPeople, setConnectedPeople] = useState<number[]>([])

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true)
        // Fetch user profile
        const profile = await getUserProfile(user.uid)
        setUserProfile(profile)
      } else {
        setIsAuthenticated(false)
        router.push("/")
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // User data
  const user = {
    name: auth.currentUser?.displayName || "John Doe",
    email: auth.currentUser?.email || "john@kiit.ac.in",
    avatar: userProfile?.photoURL || "/placeholder.svg?height=40&width=40",
    branch: userProfile?.branch || "Not set",
    semester: userProfile?.semester || "Not set",
  }

  // Mock events data
  const events = [
    {
      id: 1,
      title: "Tech Talk: Future of AI",
      description: "Industry experts discuss the latest trends in artificial intelligence",
      date: "Dec 15, 2024",
      time: "2:00 PM",
      location: "Auditorium A",
      attendees: 156,
      category: "academic",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 2,
      title: "Inter-College Basketball Tournament",
      description: "Annual basketball championship between colleges",
      date: "Dec 20, 2024",
      time: "9:00 AM",
      location: "Sports Complex",
      attendees: 89,
      category: "sports",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: 3,
      title: "Photography Exhibition",
      description: "Showcase of student photography work",
      date: "Dec 18, 2024",
      time: "11:00 AM",
      location: "Art Gallery",
      attendees: 67,
      category: "creative",
      image: "/placeholder.svg?height=200&width=300",
    },
  ]

  const categories = [
    { id: "all", name: "All" },
    { id: "academic", name: "Academic" },
    { id: "sports", name: "Sports" },
    { id: "creative", name: "Creative" },
    { id: "tech", name: "Tech" },
    { id: "social", name: "Social" },
  ]

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleJoinEvent = (eventId: number) => {
    if (joinedEvents.includes(eventId)) {
      setJoinedEvents(joinedEvents.filter((id) => id !== eventId))
    } else {
      setJoinedEvents([...joinedEvents, eventId])
    }
  }

  const handleCreateGroup = () => {
    router.push("/dashboard/groups")
  }

  const handleCreateEvent = () => {
    setCreateEventOpen(true)
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleSettings = () => {
    // Add settings navigation
    console.log("Opening settings...")
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
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </Button>

              <Link href="/dashboard/connections">
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                  <Users className="h-5 w-5" />
                </Button>
              </Link>

              <Dialog>
                <DialogTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer border-2 border-green-500">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
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
                      onClick={handleSettings}
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

      <main className="container mx-auto max-w-7xl px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user.name}! 👋</h1>
          <p className="text-gray-400">
            {user.branch} • Semester {user.semester}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-green-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="events" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Events ({filteredEvents.length})
            </TabsTrigger>
            <Link href="/dashboard/groups">
              <TabsTrigger value="groups" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                <Users className="h-4 w-4 mr-2" />
                Groups
              </TabsTrigger>
            </Link>
            <Link href="/dashboard/people">
              <TabsTrigger value="people" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                <User className="h-4 w-4 mr-2" />
                People
              </TabsTrigger>
            </Link>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
              <Button
                className="bg-green-600 hover:bg-green-700 transition-all duration-300 flex items-center gap-2"
                onClick={handleCreateEvent}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="aspect-video bg-gray-700 rounded-t-lg relative overflow-hidden">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-gray-900/80 text-white">
                        {event.attendees} attending
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg">{event.title}</CardTitle>
                    <CardDescription className="text-gray-400">{event.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {event.date} at {event.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <Button
                      className={`w-full ${
                        joinedEvents.includes(event.id)
                          ? "bg-gray-600 hover:bg-gray-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                      onClick={() => handleJoinEvent(event.id)}
                    >
                      {joinedEvents.includes(event.id) ? "Leave Event" : "Join Event"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No events found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Event Dialog */}
      <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Event Title</label>
              <Input
                placeholder="Enter event title"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Description</label>
              <textarea
                placeholder="Describe your event..."
                className="w-full min-h-[80px] rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Date</label>
                <Input type="date" className="bg-gray-700 border-gray-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Time</label>
                <Input type="time" className="bg-gray-700 border-gray-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Location</label>
              <Input
                placeholder="Event location"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => setCreateEventOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => {
                console.log("Creating event...")
                setCreateEventOpen(false)
              }}
            >
              Create Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
