"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ArrowRight, Mail, Eye, EyeOff, AlertCircle, CheckCircle, User, RefreshCw, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  signUp,
  resendVerificationEmail,
  signInWithGoogle,
  generateUsernameSuggestions,
  checkUsernameAvailability,
} from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/firebase"

export function SignupForm() {
  const router = useRouter()
  const [step, setStep] = useState<"method" | "signup" | "verification">("method")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Username validation states
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<"available" | "taken" | "invalid" | null>(null)
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const isKiitEmail = (email: string) => {
    return email.toLowerCase().endsWith("@kiit.ac.in")
  }

  // Generate username suggestions when name or email changes
  useEffect(() => {
    if (name && email) {
      const suggestions = generateUsernameSuggestions(name, email)
      setUsernameSuggestions(suggestions)
    }
  }, [name, email])

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

  const handleGoogleClick = () => {
    setStep("signup")
    setAlert(null)
  }

  const handleManualClick = () => {
    setStep("signup")
    setAlert(null)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      setAlert({ type: "error", message: "Please accept the terms and conditions." })
      return
    }

    // Validate KIIT email
    if (!isKiitEmail(email)) {
      setAlert({ type: "error", message: "Please use your official KIIT email address (@kiit.ac.in)." })
      return
    }

    // Validate username
    if (usernameStatus !== "available") {
      setAlert({ type: "error", message: "Please choose a valid and available username." })
      return
    }

    if (!name.trim()) {
      setAlert({ type: "error", message: "Please enter your full name." })
      return
    }

    setIsLoading(true)
    setAlert(null)

    const result = await signUp(email, password, name.trim(), username)

    if (result.success) {
      setAlert({ type: "success", message: result.message })
      setStep("verification")
    } else {
      setAlert({ type: "error", message: result.error })
    }

    setIsLoading(false)
  }

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      setAlert({ type: "error", message: "No user found. Please try signing up again." })
      return
    }

    setIsLoading(true)
    const result = await resendVerificationEmail(auth.currentUser)

    if (result.success) {
      setAlert({ type: "success", message: result.message })
    } else {
      setAlert({ type: "error", message: result.error })
    }

    setIsLoading(false)
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setAlert(null)

    const result = await signInWithGoogle()

    if (result.success) {
      setAlert({ type: "success", message: result.message })
      // Don't redirect here, let AuthRedirect handle it
      setTimeout(() => {
        window.location.reload() // Trigger AuthRedirect check
      }, 1500)
    } else {
      setAlert({ type: "error", message: result.error })
    }

    setIsLoading(false)
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

  if (step === "method") {
    return (
      <div className="flex flex-col gap-4 pt-2">
        {alert && (
          <Alert
            className={`${alert.type === "error" ? "border-red-500 bg-red-500/10" : "border-green-500 bg-green-500/10"}`}
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

        {/* Google Sign Up Button */}
        <Button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="relative flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            "Sign up with Google"
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="bg-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-800 px-3 text-gray-400 font-medium">Or sign up with</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="flex items-center justify-between border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 transition-all duration-200 font-medium"
          onClick={handleManualClick}
        >
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email & Password
          </span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (step === "signup") {
    return (
      <div className="space-y-6 pt-2">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Create Account</h3>
          <p className="text-sm text-gray-400">Join the KIIT community today</p>
        </div>

        {alert && (
          <Alert
            className={`${alert.type === "error" ? "border-red-500 bg-red-500/10" : "border-green-500 bg-green-500/10"}`}
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

        <form className="space-y-4" onSubmit={handleSignup}>
          <div className="rounded-lg bg-gradient-to-r from-green-900/30 to-green-800/30 p-4 border border-green-700/50">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-00KFNlkVFlDAz4CLvpBnziDHPJck1I.png"
                alt="KIIT Logo"
                className="h-6 w-6"
              />
              <div>
                <p className="font-medium text-green-300">KIIT Students Only</p>
                <p className="text-sm text-green-200">Use your official KIIT email address</p>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="signup-name" className="text-gray-300 font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-gray-300 font-medium">
              KIIT Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (e.target.value && !isKiitEmail(e.target.value) && e.target.value.includes("@")) {
                    setAlert({ type: "error", message: "Please use your official KIIT email address (@kiit.ac.in)." })
                  } else if (alert?.type === "error" && alert.message.includes("KIIT email")) {
                    setAlert(null)
                  }
                }}
                placeholder="yourname@kiit.ac.in"
                className={`pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 ${
                  email && !isKiitEmail(email) && email.includes("@") ? "border-red-500" : ""
                }`}
                required
              />
            </div>
            <p className="text-xs text-gray-400">Must be an official KIIT University email address</p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="signup-username" className="text-gray-300 font-medium">
              Username
            </Label>
            <div className="relative">
              <Input
                id="signup-username"
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

            {/* Username status message */}
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

            {/* Username suggestions */}
            {usernameSuggestions.length > 0 && (usernameStatus === "taken" || !username) && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  {showSuggestions ? "Hide suggestions" : "Show username suggestions"}
                </button>

                {showSuggestions && (
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
                )}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-gray-300 font-medium">
              Create Password
            </Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="pr-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
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
            <p className="text-xs text-gray-400">Must be at least 6 characters long</p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              className="border-gray-500 data-[state=checked]:bg-green-600 mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
              I agree to the{" "}
              <button type="button" className="text-green-400 hover:text-green-300 underline">
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" className="text-green-400 hover:text-green-300 underline">
                Privacy Policy
              </button>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !acceptTerms || usernameStatus !== "available"}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-900/50 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>

          <Button
            variant="link"
            className="w-full p-0 text-green-400 hover:text-green-300 transition-colors"
            onClick={() => {
              setStep("method")
              setAlert(null)
            }}
          >
            ← Back to options
          </Button>
        </form>
      </div>
    )
  }

  if (step === "verification") {
    return (
      <div className="space-y-6 pt-2">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Verify Your Email</h3>
          <p className="text-sm text-gray-400">We've sent a verification link to your email</p>
        </div>

        {alert && (
          <Alert
            className={`${alert.type === "error" ? "border-red-500 bg-red-500/10" : "border-green-500 bg-green-500/10"}`}
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

        <div className="rounded-lg bg-gradient-to-r from-green-900/30 to-green-800/30 p-4 border border-green-700/50">
          <div className="flex items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-00KFNlkVFlDAz4CLvpBnziDHPJck1I.png"
              alt="KIIT Logo"
              className="h-5 w-5"
            />
            <div>
              <p className="font-medium text-green-300">Check your inbox</p>
              <p className="text-sm text-green-200">Click the verification link to activate your account</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-center text-sm text-gray-300">
            <p>
              Sent to: <span className="text-white font-medium">{email}</span>
            </p>
            {username && (
              <p>
                Username: <span className="text-green-400 font-medium">@{username}</span>
              </p>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-3">Didn't receive the email? Check your spam folder or</p>
            <Button
              variant="outline"
              onClick={handleResendVerification}
              disabled={isLoading}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resending...
                </div>
              ) : (
                "Resend verification email"
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-400">
            <p>After verifying your email, you can sign in to access your account.</p>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => {
              setStep("method")
              setAlert(null)
            }}
          >
            Back to Sign In
          </Button>
        </div>

        <Button
          variant="link"
          className="w-full p-0 text-green-400 hover:text-green-300 transition-colors"
          onClick={() => {
            setStep("method")
            setAlert(null)
          }}
        >
          ← Back to sign up options
        </Button>
      </div>
    )
  }

  return null
}
