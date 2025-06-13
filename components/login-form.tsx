"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { signIn, resetPassword, signInWithGoogle } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"credentials" | "google" | "forgot-password" | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const isKiitEmail = (email: string) => {
    return email.toLowerCase().endsWith("@kiit.ac.in")
  }

  const handleCredentialsClick = () => {
    setLoginMethod("credentials")
    setAlert(null)
  }

  const handleGoogleClick = () => {
    setLoginMethod("google")
    setAlert(null)
  }

  const handleForgotPassword = () => {
    setLoginMethod("forgot-password")
    setAlert(null)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAlert(null)

    // Validate KIIT email only if identifier is an email
    if (identifier.includes("@") && !isKiitEmail(identifier)) {
      setAlert({ type: "error", message: "Please use your official KIIT email address (@kiit.ac.in)." })
      setIsLoading(false)
      return
    }

    const result = await signIn(identifier, password, rememberMe)

    if (result.success) {
      setAlert({ type: "success", message: result.message })
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } else {
      setAlert({ type: "error", message: result.error })
    }

    setIsLoading(false)
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setAlert(null)

    // Validate KIIT email
    if (!isKiitEmail(resetEmail)) {
      setAlert({ type: "error", message: "Please use your official KIIT email address (@kiit.ac.in)." })
      setIsLoading(false)
      return
    }

    const result = await resetPassword(resetEmail)

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

  if (!loginMethod) {
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

        {/* Google Sign In Button */}
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
            "Continue with Google"
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="bg-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-800 px-3 text-gray-400 font-medium">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="flex items-center justify-between border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 transition-all duration-200 font-medium"
          onClick={handleCredentialsClick}
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

  if (loginMethod === "forgot-password") {
    return (
      <div className="space-y-6 pt-2">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Reset Password</h3>
          <p className="text-sm text-gray-400">Enter your email to receive a password reset link</p>
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

        <form className="space-y-4" onSubmit={handlePasswordReset}>
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-gray-300 font-medium">
              KIIT Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value)
                  if (e.target.value && !isKiitEmail(e.target.value) && e.target.value.includes("@")) {
                    setAlert({ type: "error", message: "Please use your official KIIT email address (@kiit.ac.in)." })
                  } else if (alert?.type === "error" && alert.message.includes("KIIT email")) {
                    setAlert(null)
                  }
                }}
                placeholder="yourname@kiit.ac.in"
                className={`pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 ${
                  resetEmail && !isKiitEmail(resetEmail) && resetEmail.includes("@") ? "border-red-500" : ""
                }`}
                required
              />
            </div>
            <p className="text-xs text-gray-400">Enter your KIIT University email address</p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-900/50 transition-all duration-200 transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending reset email...
              </div>
            ) : (
              "Send Reset Email"
            )}
          </Button>

          <Button
            variant="link"
            className="w-full p-0 text-green-400 hover:text-green-300 transition-colors"
            onClick={() => {
              setLoginMethod(null)
              setAlert(null)
            }}
          >
            ← Back to login options
          </Button>
        </form>
      </div>
    )
  }

  if (loginMethod === "credentials") {
    return (
      <div className="space-y-6 pt-2">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Welcome back</h3>
          <p className="text-sm text-gray-400">Enter your credentials to access your account</p>
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

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="identifier" className="text-gray-300 font-medium">
              Username or KIIT Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  if (e.target.value.includes("@") && !isKiitEmail(e.target.value)) {
                    setAlert({ type: "error", message: "Please use your official KIIT email address (@kiit.ac.in)." })
                  } else if (alert?.type === "error" && alert.message.includes("KIIT email")) {
                    setAlert(null)
                  }
                }}
                placeholder="Enter username or yourname@kiit.ac.in"
                className={`pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 ${
                  identifier.includes("@") && !isKiitEmail(identifier) ? "border-red-500" : ""
                }`}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300 font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-10 pr-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-gray-600 bg-gray-700 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <Label htmlFor="remember-me" className="text-gray-300 cursor-pointer">
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-900/50 transition-all duration-200 transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>

          <Button
            variant="link"
            className="w-full p-0 text-green-400 hover:text-green-300 transition-colors"
            onClick={() => setLoginMethod(null)}
          >
            ← Back to options
          </Button>
        </form>
      </div>
    )
  }

  return null
}
