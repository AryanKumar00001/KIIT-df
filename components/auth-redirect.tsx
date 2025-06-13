"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getUserProfile } from "@/lib/userService"
import { UsernameSetup } from "./username-setup"

interface AuthRedirectProps {
  redirectTo?: string
  requireVerification?: boolean
}

export default function AuthRedirect({
  redirectTo = "/dashboard",
  requireVerification = true,
}: AuthRedirectProps) {
  const router = useRouter()
  const [showUsernameSetup, setShowUsernameSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email?.toLowerCase() || ""
        const isKiitEmail = email.endsWith("@kiit.ac.in")

        if (!isKiitEmail) {
          alert("Please use your official KIIT email address (@kiit.ac.in).")
          await auth.signOut()
          return
        }

        if (requireVerification && !user.emailVerified) {
          setIsLoading(false)
          return
        }

        if (user.emailVerified) {
          const userProfile = await getUserProfile(user.uid)

          if (!userProfile) {
            setShowUsernameSetup(true)
            setIsLoading(false)
          } else {
            router.push(redirectTo)
          }
        }
      } else {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router, redirectTo, requireVerification])

  const handleUsernameSetupComplete = () => {
    setShowUsernameSetup(false)
    router.push("/dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (showUsernameSetup) {
    return <UsernameSetup onComplete={handleUsernameSetupComplete} />
  }

  return null
}
