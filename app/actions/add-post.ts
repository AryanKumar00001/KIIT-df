"use server"

import { uploadToCloudinary } from "@/lib/cloudinary"
import { addPostToProfile } from "@/lib/userService"

export async function addPostAction(userId: string, formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, message: "No file provided" }
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file)

    if (!imageUrl) {
      return { success: false, message: "Failed to upload image" }
    }

    // Add to user profile
    const success = await addPostToProfile(userId, imageUrl)

    if (success) {
      return { success: true, message: "Post added successfully", imageUrl }
    } else {
      return { success: false, message: "Failed to add post to profile" }
    }
  } catch (error) {
    console.error("Error in addPostAction:", error)
    return { success: false, message: "Failed to add post" }
  }
}
