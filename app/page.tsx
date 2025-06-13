"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Trophy, Film } from "lucide-react"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"
import { SignupForm } from "@/components/signup-form"
import { useRef } from "react"
import AuthRedirect from "@/components/auth-redirect"

export default function Home() {
  const signupTabRef = useRef<HTMLButtonElement>(null)

  const handleGetStarted = () => {
    // Trigger the signup tab
    signupTabRef.current?.click()
    // Scroll to the form
    document.getElementById("auth-form")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900">
      {/* Add the AuthRedirect component to handle automatic redirects */}
      <AuthRedirect redirectTo="/dashboard" requireVerification={true} />

      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center px-6 sm:px-8 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-00KFNlkVFlDAz4CLvpBnziDHPJck1I.png"
              alt="KIIT Logo"
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-green-400">KIIT LinkUp</span>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-green-400">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-green-400">
              How It Works
            </Link>
            <Link href="#about" className="text-sm font-medium text-gray-300 hover:text-green-400">
              About
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto max-w-7xl grid items-center gap-6 px-6 sm:px-8 pb-8 pt-6 md:grid-cols-2 md:py-10 relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
          <div className="flex flex-col items-start gap-4">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl text-white">
              Welcome to <span className="text-green-400">KIIT LinkUp</span>
            </h1>
            <p className="max-w-[600px] text-lg text-gray-300 md:text-xl">
              Connect with like-minded students at KIIT University. Find peers for collaboration, friendship, or
              learning based on shared interests, skills, and goals.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/50"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <Card
              id="auth-form"
              className="w-full max-w-md border-gray-700 shadow-xl shadow-black/50 bg-gray-800/80 backdrop-blur-sm"
            >
              <CardHeader>
                <CardTitle className="text-center text-green-400">Join KIIT LinkUp</CardTitle>
                <CardDescription className="text-center text-gray-300">
                  Connect with students who share your interests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                    <TabsTrigger
                      value="login"
                      className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      ref={signupTabRef}
                      value="signup"
                      className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <LoginForm />
                  </TabsContent>
                  <TabsContent value="signup">
                    <SignupForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="features" className="py-12 md:py-24 relative overflow-hidden bg-gray-800">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 -z-10"></div>
          <div className="container mx-auto max-w-7xl px-6 sm:px-8 relative">
            <div className="absolute top-0 right-0 -z-10 h-72 w-72 rounded-full bg-green-500 opacity-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-green-500 opacity-10 blur-3xl"></div>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Find Your Circle
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-gray-300 md:text-xl">
                KIIT LinkUp helps you connect with peers who share your interests, making your college experience more
                meaningful.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-500/50">
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-green-400" />
                  <CardTitle className="text-white">Academic Circles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Connect with students in your branch or those who share your academic interests. Form study groups,
                    collaborate on projects, and excel together.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-500/50">
                <CardHeader>
                  <Trophy className="h-10 w-10 text-green-400" />
                  <CardTitle className="text-white">Sports & Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Find teammates, workout buddies, or fellow enthusiasts for any sport or physical activity. Stay
                    active and have fun with like-minded peers.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/80 backdrop-blur-sm border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-500/50">
                <CardHeader>
                  <Film className="h-10 w-10 text-green-400" />
                  <CardTitle className="text-white">Entertainment & Hobbies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">
                    Discover students who share your passion for music, movies, art, gaming, or any other hobby. Build
                    friendships around common interests.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-12 md:py-24 relative bg-gray-900">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
          <div className="container mx-auto max-w-7xl px-6 sm:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">How It Works</h2>
              <p className="mx-auto mt-4 max-w-[700px] text-gray-300 md:text-xl">
                Getting started with KIIT LinkUp is easy. Follow these simple steps to find your circle.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-4">
              <div className="flex flex-col items-center text-center bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900 text-green-300 shadow-inner">
                  1
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">Sign Up</h3>
                <p className="mt-2 text-gray-300">Create an account using your KIIT email ID</p>
              </div>
              <div className="flex flex-col items-center text-center bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900 text-green-300 shadow-inner">
                  2
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">Complete Profile</h3>
                <p className="mt-2 text-gray-300">Add your details and select your interests</p>
              </div>
              <div className="flex flex-col items-center text-center bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900 text-green-300 shadow-inner">
                  3
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">Discover Circles</h3>
                <p className="mt-2 text-gray-300">Browse groups based on your interests</p>
              </div>
              <div className="flex flex-col items-center text-center bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900 text-green-300 shadow-inner">
                  4
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">Connect</h3>
                <p className="mt-2 text-gray-300">Join circles and start collaborating</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-12 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-green-800 -z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px] opacity-10 -z-10"></div>
          <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-green-500 opacity-20 blur-3xl"></div>
          <div className="container mx-auto max-w-7xl px-6 sm:px-8 text-center relative">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
              Ready to find your circle?
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-green-100 md:text-xl">
              Join KIIT LinkUp today and connect with students who share your interests, goals, and passions.
            </p>
            <Button
              size="lg"
              className="mt-8 bg-white text-green-800 hover:bg-gray-100 shadow-lg"
              onClick={handleGetStarted}
            >
              Get Started Now
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-800 py-6 bg-gray-900">
        <div className="container mx-auto max-w-7xl px-6 sm:px-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-00KFNlkVFlDAz4CLvpBnziDHPJck1I.png"
              alt="KIIT Logo"
              className="h-6 w-6"
            />
            <span className="text-sm font-medium text-gray-300">KIIT LinkUp</span>
          </div>
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} KIIT LinkUp. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-gray-400 hover:text-green-400">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-green-400">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-green-400">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
