import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { User } from "firebase/auth"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  username: string
  photoURL?: string
  coverPhotoURL?: string
  createdAt: Date
  updatedAt: Date
  isProfileComplete: boolean
  branch?: string
  semester?: number
  connectionsCount?: number
  bio?: string
  socialLinks?: {
    instagram?: string
    linkedin?: string
    github?: string
  }
  interests?: string[]
  societies?: string[]
  posts?: string[] // Array of image URLs
  connections?: string[] // Array of connection IDs
  sentConnectionRequests?: string[] // Array of request IDs
  receivedConnectionRequests?: string[] // Array of request IDs
}

// Helper function to calculate year from semester
export const calculateYearFromSemester = (semester: number): number => {
  if (semester >= 1 && semester <= 2) return 1
  if (semester >= 3 && semester <= 4) return 2
  if (semester >= 5 && semester <= 6) return 3
  if (semester >= 7 && semester <= 8) return 4
  return 0 // Invalid semester
}

// Check if username is available
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  if (!username || username.length < 3) return false

  try {
    const usernamesRef = collection(db, "usernames")
    const q = query(usernamesRef, where("username", "==", username.toLowerCase()))
    const querySnapshot = await getDocs(q)
    return querySnapshot.empty
  } catch (error) {
    console.error("Error checking username availability:", error)
    return false
  }
}

// Create user profile in Firestore
export const createUserProfile = async (user: User, username: string): Promise<boolean> => {
  try {
    // Check if username is still available
    const isAvailable = await checkUsernameAvailability(username)
    if (!isAvailable) {
      throw new Error("Username is already taken!")
    }

    // Create base profile without photoURL
    const baseProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || "",
      username: username.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isProfileComplete: false,
    }

    // Only add photoURL if it exists
    const userProfile: UserProfile = user.photoURL ? { ...baseProfile, photoURL: user.photoURL } : baseProfile

    // Create user document
    await setDoc(doc(db, "users", user.uid), userProfile)

    // Reserve username
    await setDoc(doc(db, "usernames", username.toLowerCase()), {
      uid: user.uid,
      username: username.toLowerCase(),
      createdAt: new Date(),
    })

    return true
  } catch (error) {
    console.error("Error creating user profile:", error)
    return false
  }
}

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid))
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// Update username
export const updateUsername = async (uid: string, newUsername: string, oldUsername?: string): Promise<boolean> => {
  try {
    // Check if new username is available
    const isAvailable = await checkUsernameAvailability(newUsername)
    if (!isAvailable) {
      throw new Error("Username is no longer available")
    }

    // Update user document
    await updateDoc(doc(db, "users", uid), {
      username: newUsername.toLowerCase(),
      updatedAt: new Date(),
    })

    // Reserve new username
    await setDoc(doc(db, "usernames", newUsername.toLowerCase()), {
      uid: uid,
      username: newUsername.toLowerCase(),
      createdAt: new Date(),
    })

    // Remove old username reservation if it exists
    if (oldUsername) {
      try {
        await setDoc(doc(db, "usernames", oldUsername.toLowerCase()), {
          uid: null,
          username: oldUsername.toLowerCase(),
          deletedAt: new Date(),
        })
      } catch (error) {
        console.error("Error removing old username:", error)
      }
    }

    return true
  } catch (error) {
    console.error("Error updating username:", error)
    return false
  }
}
export const updateUserProfile = async (uid: string, profileData: Partial<UserProfile>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "users", uid), {
      ...profileData,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error("Error updating user profile:", error)
    return false
  }
}

// Generate username suggestions
export const generateUsernameSuggestions = (name: string, email: string): string[] => {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9.]/g, "")
  const emailPrefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "")

  const suggestions = [
    cleanName,
    emailPrefix,
    `${cleanName}${Math.floor(Math.random() * 100)}`,
    `${emailPrefix}${Math.floor(Math.random() * 100)}`,
    `${cleanName}.${Math.floor(Math.random() * 1000)}`,
    `kiit.${cleanName}`,
    `${cleanName}.kiit`,
  ]

  // Remove duplicates and filter out empty strings
  return [...new Set(suggestions)].filter((s) => s.length >= 3)
}

// Find user by username
export const findUserByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    const usernamesRef = collection(db, "usernames")
    const q = query(usernamesRef, where("username", "==", username.toLowerCase()))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const usernameDoc = querySnapshot.docs[0]
    const uid = usernameDoc.data().uid

    if (!uid) {
      return null
    }

    return await getUserProfile(uid)
  } catch (error) {
    console.error("Error finding user by username:", error)
    return null
  }
}

// Get all users
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, "users")
    const querySnapshot = await getDocs(usersRef)
    return querySnapshot.docs.map((doc) => doc.data() as UserProfile)
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

// Add post to user profile
export const addPostToProfile = async (uid: string, imageUrl: string): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid)
    if (!userProfile) return false

    const updatedPosts = [...(userProfile.posts || []), imageUrl]

    await updateDoc(doc(db, "users", uid), {
      posts: updatedPosts,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error("Error adding post:", error)
    return false
  }
}

// Remove post from user profile
export const removePostFromProfile = async (uid: string, imageUrl: string): Promise<boolean> => {
  try {
    const userProfile = await getUserProfile(uid)
    if (!userProfile) return false

    const updatedPosts = (userProfile.posts || []).filter((post) => post !== imageUrl)

    await updateDoc(doc(db, "users", uid), {
      posts: updatedPosts,
      updatedAt: new Date(),
    })
    return true
  } catch (error) {
    console.error("Error removing post:", error)
    return false
  }
}
