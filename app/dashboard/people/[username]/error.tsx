"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-gray-400 mb-6">There was an error loading this profile.</p>
        <div className="space-x-4">
          <Button onClick={() => reset()} className="bg-green-600 hover:bg-green-700 text-white">
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = "/dashboard/people")}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
