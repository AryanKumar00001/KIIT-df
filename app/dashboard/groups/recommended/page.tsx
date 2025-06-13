"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, limit, doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { GroupCard } from "@/components/group-card"
import { toast } from "sonner"

interface Group {
  id: string
  name: string
  description: string
  category: string
  memberCount: number
  interests?: string[]
  imageUrl?: string
  members?: string[]
}

export default function RecommendedGroupsPage() {
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userInterests, setUserInterests] = useState<string[]>([])
  const [userGroups, setUserGroups] = useState<string[]>([])

  useEffect(() => {
    const fetchUserInterests = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) return []

        const userDocRef = doc(db, "users", currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)
        const userData = userDocSnap.data()
        return userData?.interests || []
      } catch (error) {
        console.error("Error fetching user interests:", error)
        return []
      }
    }

    const fetchRecommendedGroups = async () => {
      try {
        const interests = await fetchUserInterests()
        setUserInterests(interests)

        // Get current user
        const currentUser = auth.currentUser
        if (!currentUser) {
          setIsLoading(false)
          return
        }

        const userId = currentUser.uid

        // Get user's joined group IDs
        const userDocRef = doc(db, "users", userId)
        const userDocSnap = await getDoc(userDocRef)
        const userData = userDocSnap.data()
        const userJoinedGroups = userData?.groups || []
        setUserGroups(userJoinedGroups)

        console.log("User joined groups:", userJoinedGroups)

        // In a real app, you'd have a more sophisticated recommendation algorithm
        // This is a simplified example that just filters by user interests
        const groupsRef = collection(db, "groups")
        let q = query(groupsRef, limit(30)) // Increased limit to ensure we have enough groups after filtering

        if (interests.length > 0) {
          q = query(groupsRef, where("interests", "array-contains-any", interests), limit(30))
        }

        const querySnapshot = await getDocs(q)

        const groupsData: Group[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Group, "id">
          groupsData.push({
            id: doc.id,
            ...data,
          })
        })

        console.log(
          "All fetched groups:",
          groupsData.map((g) => ({ id: g.id, name: g.name })),
        )

        // Filter out groups the user has already joined - check both the user's groups array and the group's members array
        const filteredGroups = groupsData.filter((group) => {
          // Check if group ID is in user's joined groups
          const inUserGroups = !userJoinedGroups.includes(group.id)

          // Check if user ID is in group's members array
          const inGroupMembers = !(group.members || []).includes(userId)

          // Only include groups where the user is not a member by either method
          return inUserGroups && inGroupMembers
        })

        console.log(
          "Filtered groups:",
          filteredGroups.map((g) => ({ id: g.id, name: g.name })),
        )

        setRecommendedGroups(filteredGroups)
      } catch (error) {
        console.error("Error fetching recommended groups:", error)
        toast.error("Failed to load recommended groups")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendedGroups()
  }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
        <h2 className="text-lg sm:text-xl font-semibold text-white">Recommended For You</h2>
      </div>

      {userInterests.length > 0 && (
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base line-clamp-2">
          Based on your interests: {userInterests.join(", ")}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
              <CardContent className="p-4 h-40 animate-pulse flex flex-col justify-between">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : recommendedGroups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {recommendedGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isJoined={false} // Always false since we filtered out joined groups
              userId={auth.currentUser?.uid || null}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium mb-2">No new recommendations</h3>
          <p className="text-gray-400 mb-6 px-4">
            {userInterests.length > 0
              ? "You've joined all the groups matching your interests. Try exploring different categories!"
              : "Update your profile interests to get personalized group recommendations."}
          </p>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => (window.location.href = userInterests.length > 0 ? "/dashboard/groups" : "/profile")}
          >
            {userInterests.length > 0 ? "Explore All Groups" : "Update Interests"}
          </Button>
        </div>
      )}
    </div>
  )
}
