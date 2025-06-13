"use server"

import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary"
import { updateUserProfile } from "@/lib/userService"

export async function uploadProfileImage(
  userId: string,
  formData: FormData,
  type: "avatar" | "cover",
  oldImageUrl?: string,
) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Delete old image if it exists
    if (oldImageUrl) {
      await deleteFromCloudinary(oldImageUrl)
    }

    // Upload new image
    const imageUrl = await uploadToCloudinary(file)
    if (!imageUrl) {
      return { success: false, error: "Failed to upload image" }
    }

    // Update profile in Firestore
    const updateData = type === "avatar" ? { photoURL: imageUrl } : { coverPhotoURL: imageUrl }
    const profileUpdated = await updateUserProfile(userId, updateData)

    if (!profileUpdated) {
      // If Firestore update fails, try to delete the uploaded image
      await deleteFromCloudinary(imageUrl)
      return { success: false, error: "Failed to update profile" }
    }

    return { success: true, imageUrl }
  } catch (error) {
    console.error("Error uploading profile image:", error)
    return { success: false, error: "An error occurred while uploading" }
  }
}

export async function uploadPost(userId: string, formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Upload image
    const imageUrl = await uploadToCloudinary(file)
    if (!imageUrl) {
      return { success: false, error: "Failed to upload image" }
    }

    // Add post to profile
    const { addPostToProfile } = await import("@/lib/userService")
    const success = await addPostToProfile(userId, imageUrl)

    if (!success) {
      // If Firestore update fails, try to delete the uploaded image
      await deleteFromCloudinary(imageUrl)
      return { success: false, error: "Failed to add post to profile" }
    }

    return { success: true, imageUrl }
  } catch (error) {
    console.error("Error uploading post:", error)
    return { success: false, error: "An error occurred while uploading" }
  }
}
