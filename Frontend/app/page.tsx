"use client"

import { useState, useEffect } from "react" // Import useEffect
import { Search, Plus, Calendar, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { motion } from "framer-motion"

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newDraft, setNewDraft] = useState({
    title: "",
    date: "",
    description: "",
  })

  const [drafts, setDrafts] = useState([])

  // Load drafts from localStorage when the component mounts
  useEffect(() => {
    const savedDrafts = localStorage.getItem("drafts")
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts))
    }
  }, [])

  const filteredDrafts = drafts.filter(
    (draft) =>
      (draft.title && draft.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (draft.description && draft.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleCreateDraft = () => {
    const newDraftWithId = {
      ...newDraft,
      id: Date.now(),
    }

    const updatedDrafts = [...drafts, newDraftWithId]
    setDrafts(updatedDrafts)

    // Save the updated list to localStorage
    localStorage.setItem("drafts", JSON.stringify(updatedDrafts))

    setIsCreateModalOpen(false)
    setNewDraft({ title: "", date: "", description: "" })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Samvaad</h1>
          <p className="text-gray-600 text-lg">Analyze e-consultation feedback and track sentiment trends</p>
        </motion.div>

        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search drafts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6">
                <Plus className="h-4 w-4 mr-2" />
                Create New Draft
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Draft</DialogTitle>
                <DialogDescription>
                  Add a new draft for sentiment analysis. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newDraft.title}
                    onChange={(e) => setNewDraft({ ...newDraft, title: e.target.value })}
                    placeholder="Enter draft title..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newDraft.date}
                    onChange={(e) => setNewDraft({ ...newDraft, date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDraft.description}
                    onChange={(e) => setNewDraft({ ...newDraft, description: e.target.value })}
                    placeholder="Enter a short description..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateDraft} className="bg-blue-600 hover:bg-blue-700">
                  Create Draft
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Drafts Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredDrafts.map((draft, index) => (
            <motion.div
              key={draft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Link href={`/draft/${draft.id}`}>
                <Card className="h-full bg-white border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <FileText className="h-5 w-5 text-blue-600 mt-1" />
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(draft.date).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {draft.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">{draft.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {filteredDrafts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center py-12"
          >
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
            <p className="text-gray-600">
              {searchTerm ? "Try adjusting your search terms." : "Create your first draft to get started."}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}