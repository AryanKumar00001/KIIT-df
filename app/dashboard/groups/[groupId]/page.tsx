"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { joinGroupAction, leaveGroupAction } from "@/app/actions/group-actions"
import { Users, Calendar, MessageSquare, Info, ArrowLeft, Loader2, Check, Clock, Tag } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

interface GroupMember {
  uid: string
  displayName: string
  username: string
  photoURL?: string
}

interface GroupData {
  id: string
  name: string
  description: string
  category: string
  interests: string[]
  createdBy: string
  createdAt: any
  memberCount: number
  members: string[]
  admins: string[]
  imageUrl: string
}

export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [group, setGroup] = useState<GroupData | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [isJoined, setIsJoined] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [joinLeaveLoading, setJoinLeaveLoading] = useState(false)

  // Handle authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!user) return

      try {
        const groupDoc = await getDoc(doc(db, "groups", params.groupId))

        if (!groupDoc.exists()) {
          toast({
            title: "Group not found",
            description: "The group you're looking for doesn't exist or has been deleted.",
            variant: "destructive",
          })
          router.push("/dashboard/groups")
          return
        }

        const groupData = {
          id: groupDoc.id,
          ...groupDoc.data(),
          // Ensure these properties always exist with default values
          interests: groupDoc.data().interests || [],
          members: groupDoc.data().members || [],
          admins: groupDoc.data().admins || [],
          memberCount: groupDoc.data().memberCount || 0,
        } as GroupData

        setGroup(groupData)

        // Check if user is a member
        setIsJoined((groupData.members || []).includes(user.uid))

        // Check if user is an admin
        setIsAdmin((groupData.admins || []).includes(user.uid))

        // Fetch members data
        const memberPromises = (groupData.members || []).slice(0, 20).map(async (memberId) => {
          const memberDoc = await getDoc(doc(db, "users", memberId))
          if (memberDoc.exists()) {
            return {
              uid: memberDoc.id,
              displayName: memberDoc.data().displayName || "Unknown User",
              username: memberDoc.data().username || "unknown",
              photoURL: memberDoc.data().photoURL,
            }
          }
          return null
        })

        const membersData = (await Promise.all(memberPromises)).filter(Boolean) as GroupMember[]
        setMembers(membersData)

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching group data:", error)
        toast({
          title: "Error",
          description: "Failed to load group data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    if (user) {
      fetchGroupData()
    } else if (user === null) {
      // User is definitely not authenticated
      setIsLoading(false)
    }
  }, [params.groupId, user, router])

  const handleJoinLeave = async () => {
    if (!user || !group) return

    setJoinLeaveLoading(true)

    try {
      if (isJoined) {
        // Leave group
        const result = await leaveGroupAction(user.uid, group.id)
        if (result.success) {
          setIsJoined(false)
          setGroup((prev) => (prev ? { ...prev, memberCount: Math.max((prev.memberCount || 1) - 1, 0) } : null))
          toast({
            title: "Left group",
            description: `You have left ${group.name}.`,
          })
        } else {
          throw new Error(result.error || "Failed to leave group")
        }
      } else {
        // Join group
        const result = await joinGroupAction(user.uid, group.id)
        if (result.success) {
          setIsJoined(true)
          setGroup((prev) => (prev ? { ...prev, memberCount: (prev.memberCount || 0) + 1 } : null))
          toast({
            title: "Joined group",
            description: `You have joined ${group.name}!`,
          })
        } else {
          throw new Error(result.error || "Failed to join group")
        }
      }
    } catch (error) {
      console.error("Error joining/leaving group:", error)
      toast({
        title: "Error",
        description: `Failed to ${isJoined ? "leave" : "join"} group. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setJoinLeaveLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4 w-full max-w-3xl">
          <div className="h-48 bg-gray-800 w-full rounded-lg"></div>
          <div className="h-8 bg-gray-800 w-2/3 rounded-md"></div>
          <div className="h-4 bg-gray-800 w-1/2 rounded-md"></div>
          <div className="flex gap-2 w-full justify-center">
            <div className="h-10 bg-gray-800 w-24 rounded-md"></div>
            <div className="h-10 bg-gray-800 w-24 rounded-md"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please sign in to view this group.</p>
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
            <Link href="/">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Group not found</h2>
          <p className="text-gray-400 mb-6">The group you're looking for doesn't exist or has been deleted.</p>
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
            <Link href="/dashboard/groups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Ensure interests is always an array
  const interests = group.interests || []
  // Ensure members is always an array
  const groupMembers = group.members || []
  // Ensure admins is always an array
  const admins = group.admins || []

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="text-gray-400 hover:text-white hover:bg-gray-800">
          <Link href="/dashboard/groups">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Link>
        </Button>
      </div>

      {/* Group header */}
      <div className="relative">
        <div className="h-48 md:h-64 w-full rounded-lg bg-gray-800 overflow-hidden">
          <img
            src={group.imageUrl || "/placeholder.jpg"}
            alt={group.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        </div>

        <div className="p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg -mt-20 md:-mt-24 mx-2 sm:mx-4 relative z-10 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{group.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge className="bg-green-600 text-white border-none">{group.category || "General"}</Badge>
                {interests.slice(0, 3).map((interest) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="bg-gray-700 text-gray-300 border-gray-600 hidden md:inline-flex"
                  >
                    {interest}
                  </Badge>
                ))}
                {interests.length > 3 && (
                  <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600 hidden md:inline-flex">
                    +{interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center text-gray-400">
                <Users className="h-4 w-4 mr-1" />
                <span className="text-sm">
                  {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                </span>
              </div>

              <Button
                onClick={handleJoinLeave}
                disabled={joinLeaveLoading}
                className={
                  isJoined
                    ? "border-green-500 text-green-400 hover:bg-green-500/10"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }
                variant={isJoined ? "outline" : "default"}
              >
                {joinLeaveLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : isJoined ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Joined
                  </>
                ) : (
                  "Join Group"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Group content */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="w-full bg-gray-800 text-gray-400 p-0 h-auto">
          <TabsTrigger
            value="about"
            className="flex-1 py-3 rounded-none data-[state=active]:bg-gray-700 data-[state=active]:text-green-400 border-b-2 border-transparent data-[state=active]:border-green-500"
          >
            <Info className="h-4 w-4 mr-2 hidden sm:inline" />
            About
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="flex-1 py-3 rounded-none data-[state=active]:bg-gray-700 data-[state=active]:text-green-400 border-b-2 border-transparent data-[state=active]:border-green-500"
          >
            <Users className="h-4 w-4 mr-2 hidden sm:inline" />
            Members
          </TabsTrigger>
          <TabsTrigger
            value="discussions"
            className="flex-1 py-3 rounded-none data-[state=active]:bg-gray-700 data-[state=active]:text-green-400 border-b-2 border-transparent data-[state=active]:border-green-500"
          >
            <MessageSquare className="h-4 w-4 mr-2 hidden sm:inline" />
            Discussions
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="flex-1 py-3 rounded-none data-[state=active]:bg-gray-700 data-[state=active]:text-green-400 border-b-2 border-transparent data-[state=active]:border-green-500"
          >
            <Calendar className="h-4 w-4 mr-2 hidden sm:inline" />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700 shadow-md">
            <CardContent className="p-5 md:p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">About this group</h3>
              <p className="text-gray-300 whitespace-pre-wrap">{group.description || "No description provided."}</p>

              <Separator className="my-5 bg-gray-700" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Category
                  </h4>
                  <p className="text-white">{group.category || "General"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Created
                  </h4>
                  <p className="text-white">
                    {group.createdAt && typeof group.createdAt.toDate === "function"
                      ? group.createdAt.toDate().toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>

              <Separator className="my-5 bg-gray-700" />

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {interests.length > 0 ? (
                    interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                        {interest}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-400">No interests specified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700 shadow-md">
            <CardContent className="p-5 md:p-6">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-400" />
                Members ({group.memberCount || 0})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((member) => (
                  <div
                    key={member.uid}
                    className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-700 border border-gray-700 transition-colors"
                  >
                    <Avatar className="h-10 w-10 border border-gray-600">
                      <AvatarImage src={member.photoURL || "/placeholder-user.jpg"} alt={member.displayName} />
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        {member.displayName ? member.displayName.charAt(0) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{member.displayName}</span>
                      <span className="text-sm text-gray-400">@{member.username}</span>
                    </div>
                    {admins.includes(member.uid) && (
                      <Badge className="ml-auto bg-green-600/20 text-green-400 border-green-500/30">Admin</Badge>
                    )}
                  </div>
                ))}
              </div>

              {members.length === 0 && (
                <div className="text-center py-12 bg-gray-900/50 rounded-lg">
                  <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No members found</p>
                </div>
              )}

              {members.length < (group.memberCount || 0) && members.length > 0 && (
                <div className="text-center mt-6">
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    View All Members
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discussions" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700 shadow-md">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-green-400" />
                  Discussions
                </h3>
                <Button
                  size="sm"
                  disabled={!isJoined}
                  className={!isJoined ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700 text-white"}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center py-16 bg-gray-900/50 rounded-lg">
                <MessageSquare className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-medium mb-2 text-white">No discussions yet</h3>
                <p className="text-gray-400 text-center max-w-md mb-6">
                  Be the first to start a discussion in this group!
                </p>
                <Button
                  disabled={!isJoined}
                  className={!isJoined ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700 text-white"}
                >
                  Start a Discussion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700 shadow-md">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-green-400" />
                  Upcoming Events
                </h3>
                <Button
                  size="sm"
                  disabled={!isJoined}
                  className={!isJoined ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700 text-white"}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>

              <div className="flex flex-col items-center justify-center py-16 bg-gray-900/50 rounded-lg">
                <Calendar className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-medium mb-2 text-white">No upcoming events</h3>
                <p className="text-gray-400 text-center max-w-md mb-6">
                  There are no events scheduled for this group yet.
                </p>
                <Button
                  disabled={!isJoined}
                  className={!isJoined ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700 text-white"}
                >
                  Create an Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
