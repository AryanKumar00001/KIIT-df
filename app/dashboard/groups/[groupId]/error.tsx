"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function GroupDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-700">
        <div className="bg-red-900/20 p-3 rounded-full mb-4 w-16 h-16 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Something went wrong</h2>
        <p className="text-gray-400 mb-6">
          We couldn't load this group. Please try again or go back to the groups page.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            Try again
          </Button>
          <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
            <Link href="/dashboard/groups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
