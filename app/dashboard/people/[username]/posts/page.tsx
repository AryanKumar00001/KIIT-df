"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, X, LogOut, Loader2, UserX, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { findUserByUsername, type UserProfile } from "@/lib/userService"
import { deletePostAction } from "@/app/actions/delete-post"

export default function PostsPage() {
  const router = useRouter()
  const params = useParams()
  const username = params.username as string

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null)
  const [userNotFound, setUserNotFound] = useState(false)
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isDeletingPost, setIsDeletingPost] = useState(false)

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

            // Check if this is the current user's profile
            if (currentUser && userProfile.uid === currentUser.uid) {
              setIsOwnProfile(true)
            }
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
  }, [username, currentUser])

  const handleBackNavigation = useCallback(() => {
    router.push(`/dashboard/people/${username}`)
  }, [router, username])

  const handleSignOut = useCallback(async () => {
    try {
      await auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [router])

  const handleDeletePost = async (postUrl: string) => {
    if (!currentUser || !targetProfile || !isOwnProfile) return

    setIsDeletingPost(true)
    try {
      // Use server action to delete the post
      const result = await deletePostAction(currentUser.uid, postUrl)

      if (result.success) {
        // Update local state
        const updatedPosts = (targetProfile.posts || []).filter((post) => post !== postUrl)
        setTargetProfile((prev) => (prev ? { ...prev, posts: updatedPosts } : null))
        setSelectedPost(null)
      } else {
        console.error("Failed to delete post:", result.message)
        alert("Failed to delete post. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Failed to delete post. Please try again.")
    }
    setIsDeletingPost(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading posts...</p>
        </div>
      </div>
    )
  }

  if (userNotFound || !targetProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <UserX className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
          <p className="text-gray-400 mb-6">The user @{username} doesn't exist or has deleted their account.</p>
          <Button onClick={() => router.push("/")} className="bg-green-600 hover:bg-green-700 text-white">
            Go to Home Page
          </Button>
        </div>
      </div>
    )
  }

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
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-red-400 hover:bg-red-500/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{targetProfile.displayName}'s Posts</h1>
          <p className="text-gray-400">@{targetProfile.username}</p>
        </div>

        {targetProfile.posts && targetProfile.posts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {targetProfile.posts.map((post, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                onClick={() => setSelectedPost(post)}
              >
                <img
                  src={post || "/placeholder.svg"}
                  alt={`Post ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {isOwnProfile && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePost(post)
                      }}
                      disabled={isDeletingPost}
                    >
                      {isDeletingPost ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-800 border-gray-700 p-8 text-center">
            <div className="text-gray-400">
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-sm">
                {isOwnProfile
                  ? "Start sharing your moments!"
                  : `${targetProfile.displayName} hasn't posted anything yet.`}
              </p>
            </div>
          </Card>
        )}
      </main>

      {/* Post Preview Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Post</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            {selectedPost && (
              <img
                src={selectedPost || "/placeholder.svg"}
                alt="Post Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
          <DialogFooter className="flex justify-between">
            {isOwnProfile && selectedPost && (
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => handleDeletePost(selectedPost)}
                disabled={isDeletingPost}
              >
                {isDeletingPost ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Post
              </Button>
            )}
            <Button
              variant="outline"
              className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600"
              onClick={() => setSelectedPost(null)}
            >
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
