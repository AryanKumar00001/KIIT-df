"use client"
import { Check } from "lucide-react"
import { SOCIETIES } from "@/lib/constants"

interface SocietiesSelectorProps {
  selectedSocieties: string[]
  onSocietiesChange: (societies: string[]) => void
}

export function SocietySelector({
  selectedSocieties,
  onSocietiesChange,
}: SocietiesSelectorProps) {
  const toggleSociety = (society: string) => {
    if (selectedSocieties.includes(society)) {
      onSocietiesChange(selectedSocieties.filter((i) => i !== society))
    } else {
      onSocietiesChange([...selectedSocieties, society])
    }
  }

  return (
    <div className="space-y-6">
      {Object.entries(SOCIETIES).map(([category, societies]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-green-400 font-medium">{category}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {societies.map((society) => (
              <label
                key={society}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-800/50 rounded p-1 transition-colors"
                onClick={() => toggleSociety(society)}
              >
                <div
                  className={`w-4 h-4 border ${
                    selectedSocieties.includes(society)
                      ? "bg-green-500 border-green-500"
                      : "border-gray-500 bg-gray-800"
                  } rounded flex items-center justify-center`}
                >
                  {selectedSocieties.includes(society) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-gray-200 text-sm select-none">{society}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
