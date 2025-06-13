import { Card, CardContent } from "@/components/ui/card"

export default function GroupsLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="w-64 h-10 bg-gray-800 rounded-md animate-pulse"></div>
        <div className="w-32 h-10 bg-gray-800 rounded-md animate-pulse"></div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 w-20 bg-gray-800 rounded-full animate-pulse"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 h-40 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-700 rounded w-5/6"></div>
              </div>
              <div className="h-6 bg-gray-700 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
