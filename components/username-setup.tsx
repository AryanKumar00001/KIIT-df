"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Check, X, AlertCircle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { createUserProfile, checkUsernameAvailability, generateUsernameSuggestions } from "@/lib/userService"
import { setUserPassword } from "@/lib/auth"

interface UsernameSetupProps {
  onComplete: () => void
}

export function UsernameSetup({ onComplete }: UsernameSetupProps) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<"available" | "taken" | "invalid" | null>(null)
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const user = auth.currentUser

  // Generate username suggestions
  useEffect(() => {
    if (user?.displayName && user?.email) {
      const suggestions = generateUsernameSuggestions(user.displayName, user.email)
      setUsernameSuggestions(suggestions)
      setShowSuggestions(true)
    }
  }, [user])

  // Check username availability with debouncing
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus("invalid")
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingUsername(true)
      try {
        const isAvailable = await checkUsernameAvailability(username)
        setUsernameStatus(isAvailable ? "available" : "taken")
      } catch (error) {
        setUsernameStatus(null)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setAlert({ type: "error", message: "No user found. Please try signing in again." })
      return
    }

    if (usernameStatus !== "available") {
      setAlert({ type: "error", message: "Please choose a valid and available username." })
      return
    }

    if (!password || password.length < 6) {
      setAlert({ type: "error", message: "Password must be at least 6 characters long." })
      return
    }

    setIsLoading(true)
    setAlert(null)

    try {
      // Set password first
      const passwordResult = await setUserPassword(password)
      if (!passwordResult.success) {
        setAlert({ type: "error", message: passwordResult.error })
        setIsLoading(false)
        return
      }

      // Then create user profile
      const profileSuccess = await createUserProfile(user, username)
      if (profileSuccess) {
        setAlert({ type: "success", message: "Account setup completed successfully!" })
        setTimeout(() => {
          onComplete()
        }, 1500)
      } else {
        setAlert({ type: "error", message: "Failed to complete setup. Please try again." })
      }
    } catch (error) {
      setAlert({ type: "error", message: "An error occurred. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUsernameSelect = (selectedUsername: string) => {
    setUsername(selectedUsername)
    setShowSuggestions(false)
  }

  const getUsernameStatusIcon = () => {
    if (isCheckingUsername) {
      return <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
    }

    switch (usernameStatus) {
      case "available":
        return <Check className="h-4 w-4 text-green-500" />
      case "taken":
        return <X className="h-4 w-4 text-red-500" />
      case "invalid":
        return <X className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const getUsernameStatusMessage = () => {
    if (isCheckingUsername) return "Checking availability..."

    switch (usernameStatus) {
      case "available":
        return "Username is available!"
      case "taken":
        return "Username is already taken"
      case "invalid":
        return "Username must be at least 3 characters"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-00KFNlkVFlDAz4CLvpBnziDHPJck1I.png"
              alt="KIIT Logo"
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-green-400">KIIT LinkUp</span>
          </div>
          <CardTitle className="text-white">Complete Your Setup</CardTitle>
          <CardDescription className="text-gray-400">
            Choose a username and set a password to complete your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {alert && (
            <Alert
              className={`mb-4 ${alert.type === "error" ? "border-red-500 bg-red-500/10" : "border-green-500 bg-green-500/10"}`}
            >
              {alert.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription className={alert.type === "error" ? "text-red-300" : "text-green-300"}>
                {alert.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-4 border border-blue-700/50 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-blue-300">Signed in with Google</p>
                <p className="text-sm text-blue-200">Complete your profile to get started</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300 font-medium">
                Username
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "")
                    setUsername(value)
                  }}
                  placeholder="Choose a unique username"
                  className={`pr-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 ${
                    usernameStatus === "available"
                      ? "border-green-500"
                      : usernameStatus === "taken"
                        ? "border-red-500"
                        : ""
                  }`}
                  required
                  minLength={3}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{getUsernameStatusIcon()}</div>
              </div>

              {username && (
                <p
                  className={`text-xs ${
                    usernameStatus === "available"
                      ? "text-green-400"
                      : usernameStatus === "taken"
                        ? "text-red-400"
                        : "text-gray-400"
                  }`}
                >
                  {getUsernameStatusMessage()}
                </p>
              )}

              {usernameSuggestions.length > 0 && showSuggestions && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Suggested usernames:</p>
                  <div className="flex flex-wrap gap-2">
                    {usernameSuggestions.slice(0, 6).map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleUsernameSelect(suggestion)}
                        className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 hover:text-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">
                Set Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400">This allows you to sign in with email/password in the future</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || usernameStatus !== "available" || !password || password.length < 6}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-900/50 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Completing setup...
                </div>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-400">
            <p>You can always change your username and password later in your profile settings.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
