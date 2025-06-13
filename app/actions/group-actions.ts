"use server"

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { revalidatePath } from "next/cache"

export async function createGroupAction(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const interests = JSON.parse(formData.get("interests") as string)
    const userId = formData.get("userId") as string

    if (!name || !category || !interests || interests.length === 0 || !userId) {
      return { success: false, error: "Missing required fields" }
    }

    // Create the group
    const groupRef = await addDoc(collection(db, "groups"), {
      name,
      description: description || "",
      category,
      interests,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      memberCount: 1,
      members: [userId],
      admins: [userId],
      imageUrl: "/placeholder.jpg",
    })

    // Add the group to the user's groups
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      groups: arrayUnion(groupRef.id),
    })

    revalidatePath("/dashboard/groups")
    return { success: true, groupId: groupRef.id }
  } catch (error) {
    console.error("Error creating group:", error)
    return { success: false, error: "Failed to create group" }
  }
}

export async function joinGroupAction(userId: string, groupId: string) {
  try {
    // Add user to group members
    const groupRef = doc(db, "groups", groupId)
    const groupSnap = await getDoc(groupRef)

    if (!groupSnap.exists()) {
      return { success: false, error: "Group not found" }
    }

    await updateDoc(groupRef, {
      members: arrayUnion(userId),
      memberCount: (groupSnap.data().memberCount || 0) + 1,
    })

    // Add group to user's groups
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      groups: arrayUnion(groupId),
    })

    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Error joining group:", error)
    return { success: false, error: "Failed to join group" }
  }
}

export async function leaveGroupAction(userId: string, groupId: string) {
  try {
    // Remove user from group members
    const groupRef = doc(db, "groups", groupId)
    const groupSnap = await getDoc(groupRef)

    if (!groupSnap.exists()) {
      return { success: false, error: "Group not found" }
    }

    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      memberCount: Math.max((groupSnap.data().memberCount || 1) - 1, 0),
    })

    // Remove group from user's groups
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      groups: arrayRemove(groupId),
    })

    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Error leaving group:", error)
    return { success: false, error: "Failed to leave group" }
  }
}
