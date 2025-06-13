"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Search, Users, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { createGroupAction } from "@/app/actions/group-actions"
import { GroupCard } from "@/components/group-card"
import { InterestsSelector } from "@/components/interests-selector"

interface Group {
  id: string
  name: string
  description: string
  category: string
  memberCount: number
  interests?: string[]
  createdAt: any
  createdBy: string
  imageUrl?: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [userGroups, setUserGroups] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Academic",
  })
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState({
    name: "",
    interests: "",
    category: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = ["Academic", "Cultural", "Sports", "Technical", "Social", "Other"]

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const groupsRef = collection(db, "groups")
      const q = query(groupsRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)

      const groupsData: Group[] = []
      querySnapshot.forEach((doc) => {
        groupsData.push({
          id: doc.id,
          ...doc.data(),
        } as Group)
      })

      setGroups(groupsData)

      // Fetch user's joined groups
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)
        const userData = userDocSnap.data()
        setUserGroups(userData?.groups || [])
      }
    } catch (error) {
      console.error("Error fetching groups:", error)
      toast.error("Failed to load groups")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const errors = {
      name: formData.name.trim() === "" ? "Group name is required" : "",
      interests: selectedInterests.length === 0 ? "At least one interest is required" : "",
      category: formData.category === "" ? "Category is required" : "",
    }

    setFormErrors(errors)

    if (errors.name || errors.interests || errors.category) {
      return
    }

    try {
      setIsSubmitting(true)

      const currentUser = auth.currentUser
      if (!currentUser) {
        toast.error("You must be logged in to create a group")
        return
      }

      const formDataObj = new FormData()
      formDataObj.append("name", formData.name.trim())
      formDataObj.append("description", formData.description.trim())
      formDataObj.append("category", formData.category)
      formDataObj.append("interests", JSON.stringify(selectedInterests))
      formDataObj.append("userId", currentUser.uid)

      const result = await createGroupAction(formDataObj)

      if (result.success) {
        // Add the new group to the state
        const newGroup = {
          id: result.groupId!,
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          interests: selectedInterests,
          memberCount: 1,
          createdAt: new Date(),
          createdBy: currentUser.uid,
          imageUrl: "/placeholder.jpg",
        }

        setGroups((prevGroups) => [newGroup, ...prevGroups])
        setUserGroups((prev) => [...prev, result.groupId!])

        // Reset form
        setFormData({
          name: "",
          description: "",
          category: "Academic",
        })
        setSelectedInterests([])

        setOpen(false)
        toast.success("Group created successfully!")
      } else {
        toast.error(result.error || "Failed to create group")
      }
    } catch (error) {
      console.error("Error creating group:", error)
      toast.error("Failed to create group")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.interests &&
        group.interests.some((interest) => interest.toLowerCase().includes(searchQuery.toLowerCase())))
    const matchesCategory = selectedCategory ? group.category === selectedCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search groups..."
            className="pl-10 bg-gray-800 border-gray-700 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 text-white border-gray-700 w-[95%] sm:w-auto mx-auto">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Group Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                  placeholder="Enter group name"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-700 border-gray-600"
                  placeholder="Describe your group (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {formErrors.category && <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Interests *</label>
                <div className="max-h-60 overflow-y-auto pr-2 border border-gray-700 rounded-md p-3 bg-gray-900">
                  <InterestsSelector selectedInterests={selectedInterests} onInterestsChange={setSelectedInterests} />
                </div>
                {formErrors.interests && <p className="text-red-500 text-sm mt-1">{formErrors.interests}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-gray-500 bg-gray-700 text-white hover:bg-gray-600 hover:text-white hover:border-green-400 font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Group"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={
              selectedCategory === null
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
            }
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
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
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isJoined={userGroups.includes(group.id)}
              userId={auth.currentUser?.uid || null}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">No groups found</h3>
          <p className="text-gray-400">
            {searchQuery || selectedCategory
              ? "Try adjusting your search or filters"
              : "Create a new group to get started"}
          </p>
        </div>
      )}
    </div>
  )
}
