import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading profile...</p>
      </div>
    </div>
  )
}
