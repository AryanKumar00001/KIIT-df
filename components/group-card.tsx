"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Check, Loader2, ArrowRight } from "lucide-react"
import { joinGroupAction, leaveGroupAction } from "@/app/actions/group-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface GroupCardProps {
  group: {
    id: string
    name: string
    description: string
    category: string
    memberCount: number
    interests?: string[]
    imageUrl?: string
  }
  isJoined: boolean
  userId: string | null
}

export function GroupCard({ group, isJoined, userId }: GroupCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [joined, setJoined] = useState(isJoined)
  const router = useRouter()

  const handleJoinToggle = async (e: React.MouseEvent) => {
    // Prevent the card click from navigating when clicking the join button
    e.stopPropagation()
    e.preventDefault()

    if (!userId) {
      toast.error("You must be logged in to join groups")
      return
    }

    setIsLoading(true)
    try {
      if (joined) {
        const result = await leaveGroupAction(userId, group.id)
        if (result.success) {
          setJoined(false)
          toast.success("You have left the group")
        } else {
          toast.error(result.error || "Failed to leave group")
        }
      } else {
        const result = await joinGroupAction(userId, group.id)
        if (result.success) {
          setJoined(true)
          toast.success("You have joined the group")
        } else {
          toast.error(result.error || "Failed to join group")
        }
      }
    } catch (error) {
      console.error("Error toggling group membership:", error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
      router.refresh()
    }
  }

  return (
    <Link href={`/dashboard/groups/${group.id}`} className="block h-full">
      <Card className="bg-gray-800 border-gray-700 overflow-hidden hover:border-green-500/50 transition-colors h-full flex flex-col cursor-pointer hover:shadow-md hover:shadow-green-500/10">
        <div
          className="h-20 sm:h-24 bg-cover bg-center"
          style={{ backgroundImage: `url(${group.imageUrl || "/placeholder.jpg"})` }}
        />
        <CardHeader className="pb-2 pt-3 px-3 sm:px-6">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg sm:text-xl font-bold text-green-400 line-clamp-1 group-hover:text-green-300">
              {group.name}
            </CardTitle>
            <Badge className="bg-green-600 hover:bg-green-700 whitespace-nowrap text-xs">{group.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 py-1 flex-grow">
          {group.description && <p className="text-gray-300 text-sm line-clamp-2 mb-3">{group.description}</p>}

          {group.interests && group.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {group.interests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gray-700">
                  {interest}
                </Badge>
              ))}
              {group.interests.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-gray-700">
                  +{group.interests.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-700 pt-3 px-3 sm:px-6 mt-auto">
          <div className="flex items-center text-gray-400 text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span>
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={joined ? "default" : "outline"}
              size="sm"
              className={
                joined
                  ? "bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm h-7 sm:h-8"
                  : "border-green-500/30 text-green-500 hover:bg-green-500/20 text-xs sm:text-sm h-7 sm:h-8"
              }
              onClick={handleJoinToggle}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : joined ? (
                <>
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Joined
                </>
              ) : (
                "Join"
              )}
            </Button>
            <ArrowRight className="h-4 w-4 text-green-500 hidden sm:block" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
