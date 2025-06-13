"use client"
import { Check } from "lucide-react"
import { INTERESTS_CATEGORIES } from "@/lib/constants"

interface InterestsSelectorProps {
  selectedInterests: string[]
  onInterestsChange: (interests: string[]) => void
}

export function InterestsSelector({
  selectedInterests,
  onInterestsChange,
}: InterestsSelectorProps) {
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      onInterestsChange(selectedInterests.filter((i) => i !== interest))
    } else {
      onInterestsChange([...selectedInterests, interest])
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(INTERESTS_CATEGORIES).map(([category, interests]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-green-400 font-medium">{category}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {interests.map((interest) => (
              <label
                key={interest}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800/50 rounded p-1 transition-colors"
                onClick={() => toggleInterest(interest)}
              >
                <div
                  className={`w-4 h-4 border ${
                    selectedInterests.includes(interest)
                      ? "bg-green-500 border-green-500"
                      : "border-gray-500 bg-gray-800"
                  } rounded flex items-center justify-center`}
                >
                  {selectedInterests.includes(interest) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-gray-200 text-sm select-none">{interest}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
