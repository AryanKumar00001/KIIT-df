"use server"

import { deleteFromCloudinary } from "@/lib/cloudinary"
import { removePostFromProfile } from "@/lib/userService"

export async function deletePostAction(userId: string, postUrl: string) {
  try {
    // Delete from Cloudinary first
    const cloudinaryDeleted = await deleteFromCloudinary(postUrl)

    if (!cloudinaryDeleted) {
      console.error("Failed to delete image from Cloudinary:", postUrl)
      // Continue with Firestore deletion even if Cloudinary fails
    }

    // Remove from user profile in Firestore
    const success = await removePostFromProfile(userId, postUrl)

    if (success) {
      return { success: true, message: "Post deleted successfully" }
    } else {
      return { success: false, message: "Failed to remove post from profile" }
    }
  } catch (error) {
    console.error("Error in deletePostAction:", error)
    return { success: false, message: "Failed to delete post" }
  }
}
