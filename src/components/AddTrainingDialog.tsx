"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { TrainingProgram } from "@/data/trainingData"

interface AddTrainingDialogProps {
  onSuccess?: () => void
}

export function AddTrainingDialog({ onSuccess }: AddTrainingDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    duration: "",
    level: "Entry Level",
    certification: "",
    location: "",
    price: 0,
    category: "",
    instructor: "",
    start_date: "",
    image: "",
    featured: false,
    tags: "", // We'll split this by comma
    rating: 0,
    reviews: 0,
    icon: "flame",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "rating" || name === "reviews" ? Number(value) : value,
    }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, featured: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Prepare data
      const tagsArray = formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : []
        
      const insertData = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: formData.description,
        duration: formData.duration,
        level: formData.level,
        certification: formData.certification,
        location: formData.location,
        price: formData.price,
        category: formData.category,
        instructor: formData.instructor,
        start_date: formData.start_date,
        image: formData.image || "/placeholder.svg",
        featured: formData.featured,
        tags: tagsArray,
        rating: formData.rating,
        reviews: formData.reviews,
        icon: formData.icon,
      }

      const { data, error } = await supabase
        .from("training_programs")
        .insert([insertData])
        .select()

      if (error) throw error

      toast.success("Training program added successfully!")
      setOpen(false)
      
      // Reset form
      setFormData({
        title: "",
        slug: "",
        description: "",
        duration: "",
        level: "Entry Level",
        certification: "",
        location: "",
        price: 0,
        category: "",
        instructor: "",
        start_date: "",
        image: "",
        featured: false,
        tags: "",
        rating: 0,
        reviews: 0,
        icon: "flame",
      })

      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error adding training:", error)
      toast.error(error.message || "Failed to add training program")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 h-12 px-6">
          <Plus className="w-5 h-5 mr-2" />
          Add Training
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add New Training Program</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new training program. It will be added to the database.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Advanced Fire Rescue" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input id="slug" name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. advanced-fire-rescue" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                required 
                placeholder="Comprehensive description of the training program..." 
                className="h-24"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleChange} required placeholder="e.g. Fire Safety" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level *</Label>
              <Input id="level" name="level" value={formData.level} onChange={handleChange} required placeholder="e.g. Intermediate" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration *</Label>
              <Input id="duration" name="duration" value={formData.duration} onChange={handleChange} required placeholder="e.g. 4-6 weeks" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification">Certification *</Label>
              <Input id="certification" name="certification" value={formData.certification} onChange={handleChange} required placeholder="e.g. NFPA Certified" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input id="instructor" name="instructor" value={formData.instructor} onChange={handleChange} placeholder="e.g. Chief John Doe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Online or City, ST" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input id="price" name="price" type="number" min="0" value={formData.price} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g. Safety, Rescue, Medical" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" name="image" value={formData.image} onChange={handleChange} placeholder="e.g. /news1.jpeg" />
            </div>

            <div className="flex items-center space-x-2 md:col-span-2 p-4 bg-gray-50 rounded-lg border">
              <Checkbox id="featured-checkbox" checked={formData.featured} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="featured-checkbox" className="font-medium cursor-pointer">
                Mark as Featured Program
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              {isLoading ? "Saving..." : "Save Training"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
