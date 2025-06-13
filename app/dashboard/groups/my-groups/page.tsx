"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { GroupCard } from "@/components/group-card"

interface Group {
  id: string
  name: string
  description: string
  category: string
  memberCount: number
  interests?: string[]
  imageUrl?: string
}

export default function MyGroupsPage() {
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) {
          setIsLoading(false)
          return
        }

        // Get user's joined group IDs
        const userDocRef = doc(db, "users", currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)
        const userData = userDocSnap.data()
        const userGroupIds = userData?.groups || []

        if (userGroupIds.length === 0) {
          setIsLoading(false)
          return
        }

        // Fetch group details for each joined group
        const groupsRef = collection(db, "groups")
        const q = query(groupsRef, where("__name__", "in", userGroupIds))
        const querySnapshot = await getDocs(q)

        const groupsData: Group[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<Group, "id">
          groupsData.push({
            id: doc.id,
            ...data,
          })
        })

        setMyGroups(groupsData)
      } catch (error) {
        console.error("Error fetching my groups:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyGroups()
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6 text-white">My Groups</h2>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
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
      ) : myGroups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {myGroups.map((group) => (
            <GroupCard key={group.id} group={group} isJoined={true} userId={auth.currentUser?.uid || null} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-medium mb-2">You haven't joined any groups yet</h3>
          <p className="text-gray-400 mb-6 px-4">
            Explore and join groups to connect with others who share your interests.
          </p>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => (window.location.href = "/dashboard/groups")}
          >
            Explore Groups
          </Button>
        </div>
      )}
    </div>
  )
}
