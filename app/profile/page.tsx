"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Lock,
  Edit,
  Calendar,
  Users,
  Upload,
  X,
  Check,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  Loader2,
  Share2,
  Copy,
  Plus,
  Grid3X3,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import {
  getUserProfile,
  updateUserProfile,
  checkUsernameAvailability,
  updateUsername,
  type UserProfile,
} from "@/lib/userService"
import { InterestsSelector } from "@/components/interests-selector"
import { SocietySelector } from "@/components/societies-selector"
import { INTERESTS_CATEGORIES, SOCIETIES } from "@/lib/constants"
import { uploadProfileImage, uploadPost } from "@/app/actions/upload-image"
import { getUserConnectionsCount } from "@/lib/connectionService"

export default function ProfilePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Dialog states
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [showAvatarPreview, setShowAvatarPreview] = useState(false)
  const [showCoverPhotoPreview, setShowCoverPhotoPreview] = useState(false)
  const [editInterestsOpen, setEditInterestsOpen] = useState(false)
  const [editSocietiesOpen, setEditSocietiesOpen] = useState(false)
  const [shareProfileOpen, setShareProfileOpen] = useState(false)

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form states
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [originalUsername, setOriginalUsername] = useState("")
  const [isUploadingPost, setIsUploadingPost] = useState(false)

  // Error states
  const [profileError, setProfileError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // Form data
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // User profile data from Firestore
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})

  const [connectionsCount, setConnectionsCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<{
    status: "none" | "sent" | "received" | "connected"
    requestId?: string
  }>({ status: "none" })
  const [showConnectionMenu, setShowConnectionMenu] = useState(false)

  // Check authentication and load profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        setIsAuthenticated(true)
        setCurrentUser(user)

        // Load user profile from Firestore
        const userProfile = await getUserProfile(user.uid)
        if (userProfile) {
          // Ensure socialLinks exists with default values
          const profileWithDefaults = {
            ...userProfile,
            socialLinks: {
              instagram: "",
              linkedin: "",
              github: "",
              ...userProfile.socialLinks,
            },
            interests: userProfile.interests || [],
            societies: userProfile.societies || [],
            posts: userProfile.posts || [],
            bio: userProfile.bio || "",
            branch: userProfile.branch || "",
            semester: userProfile.semester || "",
          }
          setProfile(profileWithDefaults)
          setEditedProfile(profileWithDefaults)
          setOriginalUsername(profileWithDefaults.username)

          const connectionsCount = await getUserConnectionsCount(user.uid)
          setConnectionsCount(connectionsCount)
        } else {
          // Fallback to basic user data if no profile exists
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || "User",
            username: "user" + user.uid.slice(-6),
            bio: "",
            branch: "",
            semester: "",
            photoURL: user.photoURL || undefined,
            coverPhotoURL: undefined,
            interests: [],
            societies: [],
            posts: [],
            socialLinks: {
              instagram: "",
              linkedin: "",
              github: "",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            isProfileComplete: false,
          }
          setProfile(fallbackProfile)
          setEditedProfile(fallbackProfile)
        }
      } else {
        setIsAuthenticated(false)
        router.push("/")
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      if (editedProfile.username && editedProfile.username !== originalUsername && editedProfile.username.length >= 3) {
        setIsCheckingUsername(true)
        const available = await checkUsernameAvailability(editedProfile.username)
        setUsernameAvailable(available)
        setIsCheckingUsername(false)
      } else {
        setUsernameAvailable(null)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [editedProfile.username, originalUsername])

  // Show loading while checking auth
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

  // Don't render profile if not authenticated
  if (!isAuthenticated || !profile) {
    return null
  }

  const handleSaveProfile = async () => {
    if (!currentUser || !editedProfile) return

    setIsSaving(true)
    setProfileError("")

    try {
      // Validate bio length
      if (editedProfile.bio && editedProfile.bio.length > 200) {
        setProfileError("Bio must be under 200 words")
        setIsSaving(false)
        return
      }

      // Check if username changed and is available
      if (editedProfile.username !== originalUsername) {
        if (!usernameAvailable) {
          setProfileError("Username is not available")
          setIsSaving(false)
          return
        }

        // Update username in both collections
        const usernameUpdated = await updateUsername(currentUser.uid, editedProfile.username, originalUsername)
        if (!usernameUpdated) {
          setProfileError("Failed to update username")
          setIsSaving(false)
          return
        }
        setOriginalUsername(editedProfile.username)
      }

      // Update profile
      const profileUpdated = await updateUserProfile(currentUser.uid, editedProfile)
      if (profileUpdated) {
        setProfile({ ...profile, ...editedProfile })
        setEditProfileOpen(false)
      } else {
        setProfileError("Failed to update profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      setProfileError("An error occurred while saving")
    }

    setIsSaving(false)
  }

  const handleChangePassword = async () => {
    if (!currentUser) return

    setIsChangingPassword(true)
    setPasswordError("")

    try {
      // Validate passwords
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("New passwords don't match")
        setIsChangingPassword(false)
        return
      }

      if (passwordForm.newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters")
        setIsChangingPassword(false)
        return
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email!, passwordForm.currentPassword)
      await reauthenticateWithCredential(currentUser, credential)

      // Update password
      await updatePassword(currentUser, passwordForm.newPassword)

      setChangePasswordOpen(false)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error: any) {
      console.error("Error changing password:", error)
      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect")
      } else if (error.code === "auth/weak-password") {
        setPasswordError("Password is too weak")
      } else {
        setPasswordError("Failed to change password")
      }
    }

    setIsChangingPassword(false)
  }

  const handleImageUpload = async (file: File, type: "avatar" | "cover") => {
    if (!currentUser) return

    try {
      // Get the old image URL if it exists
      const oldImageUrl = type === "avatar" ? profile?.photoURL : profile?.coverPhotoURL

      // Create FormData
      const formData = new FormData()
      formData.append("file", file)

      // Call server action
      const result = await uploadProfileImage(currentUser.uid, formData, type, oldImageUrl)

      if (result.success && result.imageUrl) {
        // Update local state
        const updatedProfile = { ...editedProfile }
        if (type === "avatar") {
          updatedProfile.photoURL = result.imageUrl
        } else {
          updatedProfile.coverPhotoURL = result.imageUrl
        }
        setEditedProfile(updatedProfile)

        // Update the main profile state to reflect the change
        const updateData = type === "avatar" ? { photoURL: result.imageUrl } : { coverPhotoURL: result.imageUrl }
        setProfile((prev) => (prev ? { ...prev, ...updateData } : null))
      } else {
        console.error("Failed to upload image:", result.error)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    }
  }

  const handlePostUpload = async (file: File) => {
    if (!currentUser) return

    setIsUploadingPost(true)
    try {
      // Create FormData
      const formData = new FormData()
      formData.append("file", file)

      // Call server action
      const result = await uploadPost(currentUser.uid, formData)

      if (result.success && result.imageUrl) {
        // Update local state
        const updatedPosts = [...(profile.posts || []), result.imageUrl]
        setProfile((prev) => (prev ? { ...prev, posts: updatedPosts } : null))
      } else {
        console.error("Failed to upload post:", result.error)
      }
    } catch (error) {
      console.error("Error uploading post:", error)
    }
    setIsUploadingPost(false)
  }

  const handleCopyLink = async () => {
    const profileUrl = `${window.location.origin}/dashboard/people/${profile.username}`
    try {
      await navigator.clipboard.writeText(profileUrl)
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const generateQRCode = () => {
    const profileUrl = `${window.location.origin}/dashboard/people/${profile.username}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
  }

  const isNewUser = profile && new Date().getTime() - new Date(profile.createdAt).getTime() < 24 * 60 * 60 * 1000 // 24 hours

  const wordCount = profile.bio
    ? profile.bio
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0

  // Safe access to social links with fallbacks
  const socialLinks = profile.socialLinks || { instagram: "", linkedin: "", github: "" }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-gray-200"
              onClick={() => router.push("/dashboard")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-00KFNlkVFlDAz4CLvpBnziDHPJck1I.png"
                  alt="KIIT Logo"
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold text-green-400">KIIT LinkUp</span>
              </Link>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-red-400 hover:bg-red-500/10"
            onClick={async () => {
              try {
                await auth.signOut()
                router.push("/")
              } catch (error) {
                console.error("Error signing out:", error)
              }
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container max-w-md mx-auto p-4 space-y-6">
        {/* Welcome Banner for New Users */}
        {isNewUser && (
          <div className="rounded-lg bg-gradient-to-r from-green-900/30 to-green-800/30 p-4 border border-green-700/50">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-00KFNlkVFlDAz4CLvpBnziDHPJck1I.png"
                alt="KIIT Logo"
                className="h-6 w-6"
              />
              <div>
                <p className="font-medium text-green-300">Welcome to KIIT LinkUp! 🎉</p>
                <p className="text-sm text-green-200">Complete your profile to start connecting with fellow students</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          {/* Cover Photo */}
          <div
            className="h-32 relative bg-cover bg-center cursor-pointer"
            style={{
              backgroundImage: profile.coverPhotoURL
                ? `url(${profile.coverPhotoURL})`
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
            onClick={() => profile.coverPhotoURL && setShowCoverPhotoPreview(true)}
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
                    e.stopPropagation() // Prevent the cover photo click handler from firing
                    setShowAvatarPreview(true)
                  }}
                  className="cursor-pointer"
                >
                  <Avatar className="h-24 w-24 border-4 border-gray-800">
                    <AvatarImage src={profile.photoURL || "/placeholder.svg"} />
                    <AvatarFallback className="bg-green-600 text-white text-2xl">
                      {profile.displayName
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
                <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
                <p className="text-gray-400">@{profile.username}</p>
                <p className="text-gray-400 mt-1">
                  {profile.branch && profile.semester
                    ? `${profile.branch} • Semester ${profile.semester}`
                    : "Student at KIIT University"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                onClick={() => setEditProfileOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {/* Bio */}
            {profile.bio && <p className="text-gray-300 mb-4 leading-relaxed">{profile.bio}</p>}

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
            <Button
              variant="outline"
              size="sm"
              className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
              onClick={() => setEditInterestsOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>

          {profile.interests && profile.interests.length > 0 ? (
            <div className="space-y-4">
              {/* Group interests by category for display */}
              {Object.entries(INTERESTS_CATEGORIES).map(([category, categoryInterests]) => {
                const userInterestsInCategory =
                  profile.interests?.filter((interest) => categoryInterests.includes(interest)) || []

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
                  profile.interests?.filter((interest) => !allCategorizedInterests.includes(interest)) || []

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
              <Button
                variant="outline"
                size="sm"
                className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                onClick={() => setEditInterestsOpen(true)}
              >
                Add Interests
              </Button>
            </div>
          )}
        </Card>
        {/* Joined Societies section */}
        <Card className="bg-gray-800 border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Societies</h3>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
              onClick={() => setEditSocietiesOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>

          {profile.societies && profile.societies.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(SOCIETIES).map(([category, societies]) => {
                const userSocietiesInCategory =
                  profile.societies?.filter((society) => societies.includes(society)) || []

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
              <Button
                variant="outline"
                size="sm"
                className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                onClick={() => setEditSocietiesOpen(true)}
              >
                Join Societies
              </Button>
            </div>
          )}
        </Card>

        {/* Posts Section */}
        <Card className="bg-gray-800 border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Posts</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                onClick={() => document.getElementById("post-upload")?.click()}
                disabled={isUploadingPost}
              >
                {isUploadingPost ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Post
              </Button>
              <input
                id="post-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handlePostUpload(file)
                }}
              />
              {profile.posts && profile.posts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  onClick={() => router.push(`/dashboard/people/${profile.username}/posts`)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {profile.posts && profile.posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {profile.posts.slice(0, 6).map((post, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push(`/dashboard/people/${profile.username}/posts`)}
                >
                  <img
                    src={post || "/placeholder.svg"}
                    alt={`Post ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {profile.posts.length > 6 && (
                <div
                  className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => router.push(`/dashboard/people/${profile.username}/posts`)}
                >
                  <div className="text-center">
                    <Plus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-400">+{profile.posts.length - 6}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Grid3X3 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-3">No posts yet</p>
              <p className="text-sm text-gray-500">Share your moments with fellow students</p>
            </div>
          )}
        </Card>

        {/* Security Section */}
        <Card className="bg-gray-800 border-gray-700 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
          <Button
            variant="outline"
            className="w-full border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
            onClick={() => setChangePasswordOpen(true)}
          >
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </Card>

        {/* Share Profile Dialog */}
        <Dialog open={shareProfileOpen} onOpenChange={setShareProfileOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Share Profile</DialogTitle>
              <DialogDescription className="text-gray-400">Share your profile with others</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Profile Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/dashboard/people/${profile.username}`}
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

        {/* Edit Profile Dialog */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Profile</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update your profile information and preferences
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {profileError && (
                <Alert className="border-red-600 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">{profileError}</AlertDescription>
                </Alert>
              )}

              {/* Cover Photo Upload */}
              <div className="space-y-2">
                <Label className="text-gray-300">Cover Photo</Label>
                <div
                  className="h-24 rounded-lg bg-cover bg-center border-2 border-dashed border-gray-600 hover:border-gray-500 cursor-pointer relative"
                  style={{
                    backgroundImage: editedProfile.coverPhotoURL
                      ? `url(${editedProfile.coverPhotoURL})`
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                  onClick={() => document.getElementById("cover-upload")?.click()}
                >
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-6 w-6 text-white mx-auto mb-1" />
                      <p className="text-xs text-white">Upload Cover</p>
                    </div>
                  </div>
                </div>
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, "cover")
                  }}
                />
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20 border-2 border-gray-700">
                  <AvatarImage src={editedProfile.photoURL || "/placeholder.svg"} />
                  <AvatarFallback className="bg-green-600 text-white text-2xl">
                    {(editedProfile.displayName || "U")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, "avatar")
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={editedProfile.displayName || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, displayName: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-300">
                    Bio ({wordCount}/200 words)
                  </Label>
                  <Textarea
                    id="bio"
                    value={editedProfile.bio || ""}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20"
                    rows={3}
                    placeholder="Tell others about yourself..."
                  />
                  <p className="text-xs text-gray-400">
                    Keep it under 200 words to help others quickly understand who you are.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-gray-300">
                      Branch
                    </Label>
                    <Select
                      value={editedProfile.branch || ""}
                      onValueChange={(value) => setEditedProfile({ ...editedProfile, branch: value })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-green-500">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="Computer Science" className="text-white hover:bg-gray-600">
                          Computer Science
                        </SelectItem>
                        <SelectItem value="Information Technology" className="text-white hover:bg-gray-600">
                          Information Technology
                        </SelectItem>
                        <SelectItem value="Electronics" className="text-white hover:bg-gray-600">
                          Electronics
                        </SelectItem>
                        <SelectItem value="Mechanical" className="text-white hover:bg-gray-600">
                          Mechanical
                        </SelectItem>
                        <SelectItem value="Civil" className="text-white hover:bg-gray-600">
                          Civil
                        </SelectItem>
                        <SelectItem value="Electrical" className="text-white hover:bg-gray-600">
                          Electrical
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semester" className="text-gray-300">
                      Semester
                    </Label>
                    <Select
                      value={editedProfile.semester || ""}
                      onValueChange={(value) => setEditedProfile({ ...editedProfile, semester: value })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:border-green-500">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()} className="text-white hover:bg-gray-600">
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Username Section */}
                <div className="space-y-2">
                  <Label htmlFor="edit-username" className="text-gray-300">
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      id="edit-username"
                      value={editedProfile.username || ""}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "")
                        setEditedProfile({ ...editedProfile, username: value })
                      }}
                      className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20"
                      placeholder="Enter username"
                    />
                    {isCheckingUsername && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                  {editedProfile.username && editedProfile.username !== originalUsername && (
                    <p
                      className={`text-xs ${usernameAvailable === true ? "text-green-400" : usernameAvailable === false ? "text-red-400" : "text-gray-400"}`}
                    >
                      {usernameAvailable === true && "✓ Username is available"}
                      {usernameAvailable === false && "✗ Username is not available"}
                      {usernameAvailable === null && "Username must be at least 3 characters"}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-600" />

              {/* Interests Section */}
              <div className="space-y-3">
                <Label className="text-gray-300">Interests</Label>
                <InterestsSelector
                  selectedInterests={editedProfile.interests || []}
                  onInterestsChange={(interests) => setEditedProfile({ ...editedProfile, interests })}
                />
              </div>

              <Separator className="bg-gray-600" />

              {/* Social Links */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-300">Social Links</h4>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-300">
                    <Instagram className="h-4 w-4 text-pink-400" />
                    Instagram Username
                  </Label>
                  <Input
                    value={editedProfile.socialLinks?.instagram || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        socialLinks: {
                          instagram: "",
                          linkedin: "",
                          github: "",
                          ...editedProfile.socialLinks,
                          instagram: e.target.value,
                        },
                      })
                    }
                    className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20"
                    placeholder="username (without @)"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-300">
                    <Linkedin className="h-4 w-4 text-blue-400" />
                    LinkedIn Username
                  </Label>
                  <Input
                    value={editedProfile.socialLinks?.linkedin || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        socialLinks: {
                          instagram: "",
                          linkedin: "",
                          github: "",
                          ...editedProfile.socialLinks,
                          linkedin: e.target.value,
                        },
                      })
                    }
                    className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20"
                    placeholder="your-linkedin-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-300">
                    <Github className="h-4 w-4 text-gray-300" />
                    GitHub Username
                  </Label>
                  <Input
                    value={editedProfile.socialLinks?.github || ""}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        socialLinks: {
                          instagram: "",
                          linkedin: "",
                          github: "",
                          ...editedProfile.socialLinks,
                          github: e.target.value,
                        },
                      })
                    }
                    className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                onClick={() => {
                  setEditProfileOpen(false)
                  setEditedProfile(profile)
                  setProfileError("")
                }}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSaveProfile}
                disabled={isSaving || (editedProfile.username !== originalUsername && !usernameAvailable)}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Change Password</DialogTitle>
              <DialogDescription className="text-gray-400">Update your account password</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {passwordError && (
                <Alert className="border-red-600 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">{passwordError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-gray-300">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20 pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20 pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                onClick={() => {
                  setChangePasswordOpen(false)
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
                  setPasswordError("")
                }}
                disabled={isChangingPassword}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Update Password
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
                src={profile.photoURL || "/placeholder.svg?height=400&width=400"}
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
                src={profile.coverPhotoURL || ""}
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

        {/* Edit Interests Dialog */}
        <Dialog open={editInterestsOpen} onOpenChange={setEditInterestsOpen}>
          <DialogContent className="bg-gray-900 text-white border-gray-700 sm:max-w-md">
            <div className="flex items-center justify-between mb-1">
              <DialogTitle className="text-white text-xl">Edit Interests</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setEditInterestsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-gray-400 text-sm">
              Select your interests to help others find you
            </DialogDescription>

            <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
              <InterestsSelector
                selectedInterests={editedProfile.interests || []}
                onInterestsChange={(interests) => setEditedProfile({ ...editedProfile, interests })}
              />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between border-t border-gray-800 pt-4">
              <Button
                variant="outline"
                className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                onClick={() => {
                  setEditInterestsOpen(false)
                  setEditedProfile({ ...editedProfile, interests: profile.interests || [] })
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  if (!currentUser) return

                  try {
                    const profileUpdated = await updateUserProfile(currentUser.uid, {
                      interests: editedProfile.interests,
                    })
                    if (profileUpdated) {
                      setProfile({ ...profile, interests: editedProfile.interests || [] })
                      setEditInterestsOpen(false)
                    }
                  } catch (error) {
                    console.error("Error saving interests:", error)
                  }
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Societies Dialog */}
        <Dialog open={editSocietiesOpen} onOpenChange={setEditSocietiesOpen}>
          <DialogContent className="bg-gray-900 text-white border-gray-700 sm:max-w-md">
            <div className="flex items-center justify-between mb-1">
              <DialogTitle className="text-white text-xl">Edit Societies</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setEditSocietiesOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-gray-400 text-sm">
              Select the societies you want to join
            </DialogDescription>

            <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
              <SocietySelector
                selectedSocieties={editedProfile.societies || []}
                onSocietiesChange={(societies) => setEditedProfile({ ...editedProfile, societies })}
              />
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between border-t border-gray-800 pt-4">
              <Button
                variant="outline"
                className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                onClick={() => {
                  setEditSocietiesOpen(false)
                  setEditedProfile({ ...editedProfile, societies: profile.societies || [] })
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  if (!currentUser) return

                  try {
                    const profileUpdated = await updateUserProfile(currentUser.uid, {
                      societies: editedProfile.societies,
                    })
                    if (profileUpdated) {
                      setProfile({ ...profile, societies: editedProfile.societies || [] })
                      setEditSocietiesOpen(false)
                    }
                  } catch (error) {
                    console.error("Error saving societies:", error)
                  }
                }}
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
