import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GroupDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="text-gray-400 hover:text-white hover:bg-gray-800">
          <Link href="/dashboard/groups">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Link>
        </Button>
      </div>

      {/* Group header skeleton */}
      <div className="relative">
        <Skeleton className="h-48 md:h-64 w-full rounded-lg bg-gray-800" />

        <div className="p-4 md:p-6 bg-gray-800 rounded-lg shadow-lg -mt-20 md:-mt-24 mx-2 sm:mx-4 relative z-10 border border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 bg-gray-700" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 bg-gray-700" />
                <Skeleton className="h-5 w-20 bg-gray-700 hidden md:block" />
                <Skeleton className="h-5 w-20 bg-gray-700 hidden md:block" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 bg-gray-700" />
              <Skeleton className="h-9 w-28 bg-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="space-y-2">
        <div className="flex w-full bg-gray-800">
          <Skeleton className="h-12 flex-1 bg-gray-700" />
          <Skeleton className="h-12 flex-1 bg-gray-700" />
          <Skeleton className="h-12 flex-1 bg-gray-700" />
          <Skeleton className="h-12 flex-1 bg-gray-700" />
        </div>

        <div className="space-y-4 mt-6">
          <Skeleton className="h-[400px] w-full rounded-lg bg-gray-800" />
        </div>
      </div>
    </div>
  )
}
