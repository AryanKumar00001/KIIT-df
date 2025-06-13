// Function to extract public_id from Cloudinary URL
function getPublicIdFromUrl(url: string): string | null {
  if (!url) return null

  try {
    // Handle different Cloudinary URL formats
    // Format 1: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image.jpg
    // Format 2: https://res.cloudinary.com/cloud_name/image/upload/folder/image.jpg

    const urlObj = new URL(url)

    // Check if this is a Cloudinary URL
    if (!urlObj.hostname.includes("cloudinary.com")) {
      console.error("Not a Cloudinary URL:", url)
      return null
    }

    const pathParts = urlObj.pathname.split("/")

    // Find the index of 'upload' in the path
    const uploadIndex = pathParts.indexOf("upload")
    if (uploadIndex === -1 || uploadIndex === pathParts.length - 1) {
      console.error("Invalid Cloudinary URL format:", url)
      return null
    }

    // Get everything after 'upload'
    const publicIdParts = pathParts.slice(uploadIndex + 1)

    // Remove version number if present (v1234567890)
    let publicId = ""
    if (publicIdParts[0].startsWith("v") && /^v\d+$/.test(publicIdParts[0])) {
      publicId = publicIdParts.slice(1).join("/")
    } else {
      publicId = publicIdParts.join("/")
    }

    // Remove file extension if present
    publicId = publicId.replace(/\.[^/.]+$/, "")

    console.log("Extracted public_id:", publicId, "from URL:", url.substring(0, 50) + "...")
    return publicId
  } catch (error) {
    console.error("Error extracting public_id:", error, "from URL:", url)
    return null
  }
}

// Function to delete image from Cloudinary (SERVER SIDE ONLY)
async function deleteFromCloudinary(url: string): Promise<boolean> {
  // Check if we're on the server side
  if (typeof window !== "undefined") {
    console.error("❌ deleteFromCloudinary should only be called on the server side")
    return false
  }

  const publicId = getPublicIdFromUrl(url)
  if (!publicId) {
    console.error("Could not extract public_id from URL:", url)
    return false
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    // More detailed logging about environment variables
    console.log("Cloudinary deletion request:", {
      publicId,
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      url: url.substring(0, 50) + "...", // Log partial URL for debugging
    })

    if (!apiKey || !apiSecret) {
      console.error("❌ Cloudinary credentials not configured:", {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        apiKeyLength: apiKey?.length,
        apiSecretLength: apiSecret?.length,
      })
      return false
    }

    // Use the Admin API endpoint with proper authentication
    const timestamp = Math.round(new Date().getTime() / 1000)
    const signature = await generateSignature(publicId, timestamp, apiSecret)

    const deleteUrl = `https://api.cloudinary.com/v1_1/djoa2550g/image/destroy?public_id=${publicId}&timestamp=${timestamp}&api_key=${apiKey}&signature=${signature}`

    console.log("Sending delete request to Cloudinary for public_id:", publicId)

    const res = await fetch(deleteUrl, {
      method: "POST",
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error("❌ Delete request failed:", {
        status: res.status,
        statusText: res.statusText,
        error: errorData,
        publicId,
        timestamp,
      })
      return false
    }

    const data = await res.json()
    if (data.result === "ok") {
      console.log("✅ Image deleted from Cloudinary:", publicId)
      return true
    } else {
      console.error("❌ Delete error details:", {
        error: data.error,
        message: data.error?.message,
        publicId,
        timestamp,
      })
      return false
    }
  } catch (error) {
    console.error("❌ Delete error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      publicId,
      url,
    })
    return false
  }
}

// Helper function to generate Cloudinary signature (SERVER SIDE ONLY)
async function generateSignature(publicId: string, timestamp: number, apiSecret: string): Promise<string> {
  // Create the string to sign
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`

  // Create a SHA-1 hash of the string
  const encoder = new TextEncoder()
  const data = encoder.encode(stringToSign)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  console.log("Generated signature for:", {
    publicId,
    timestamp,
    hasApiSecret: !!apiSecret,
    signatureLength: signature.length,
  })

  return signature
}

// Client-safe upload function (no deletion)
export async function uploadToCloudinary(file: File): Promise<string | null> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", "unsigned_preset")

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/djoa2550g/image/upload", {
      method: "POST",
      body: formData,
    })

    const data = await res.json()

    if (data.secure_url) {
      console.log("✅ Image URL:", data.secure_url)
      return data.secure_url
    } else {
      console.error("❌ Upload error:", data)
      return null
    }
  } catch (error) {
    console.error("❌ Upload error:", error)
    return null
  }
}

// Server-side upload function with deletion capability
export async function uploadToCloudinaryWithDeletion(file: File, oldImageUrl?: string): Promise<string | null> {
  // Check if we're on the server side
  if (typeof window !== "undefined") {
    console.error("❌ uploadToCloudinaryWithDeletion should only be called on the server side")
    return null
  }

  // If there's an old image, delete it first
  if (oldImageUrl) {
    await deleteFromCloudinary(oldImageUrl)
  }

  return uploadToCloudinary(file)
}

export { deleteFromCloudinary, getPublicIdFromUrl }
