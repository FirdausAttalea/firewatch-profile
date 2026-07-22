"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Search,
  Filter,
  Clock,
  Users,
  Award,
  MapPin,
  Star,
  ChevronDown,
  X,
  Plus,
  Minus,
  ContrastIcon as Compare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { Link } from "react-router-dom" // Pastikan import ini benar
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { TrainingProgram } from "@/data/trainingData"
import { supabase } from "@/lib/supabaseClient"
import FloatingHeader from "@/components/FloatingHeader"
import Footer from "@/components/Footer"
import { AddTrainingDialog } from "@/components/AddTrainingDialog"

const categories = [
  "All",
  "Fire Safety",
  "Medical Emergency",
  "Hazmat",
  "Technical Rescue",
  "Wildland Fire",
  "Investigation",
]
const levels = ["All", "Entry Level", "Intermediate", "Professional", "Advanced"]
const certifications = [
  "All",
  "NFPA Certified",
  "NREMT Certified",
  "HAZMAT Certified",
  "NFPA 1006 Certified",
  "S-130/S-190 Certified",
  "IAAI Certified",
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
}

const filterVariants: Variants = {
  hidden: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.3,
    },
  },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
    },
  },
}

export default function TrainingPage() {
  const [allPrograms, setAllPrograms] = useState<TrainingProgram[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedLevel, setSelectedLevel] = useState("All")
  const [selectedCertification, setSelectedCertification] = useState("All")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [sortBy, setSortBy] = useState("featured")
  const [showFilters, setShowFilters] = useState(false)
  const [comparePrograms, setComparePrograms] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6) // 6 items per page for 3x2 grid

  const fetchPrograms = async () => {
    const { data, error } = await supabase.from("training_programs").select("*")

    if (error) {
      console.error("Error fetching training programs:", error)
    } else if (data) {
      setAllPrograms(data as TrainingProgram[])
    }
  }

  useEffect(() => {
    fetchPrograms()
    window.scrollTo(0, 0)
  }, [])

  const addToCompare = (programId: string) => {
    if (comparePrograms.length < 3 && !comparePrograms.includes(programId)) {
      setComparePrograms([...comparePrograms, programId])
    }
  }

  const removeFromCompare = (programId: string) => {
    setComparePrograms(comparePrograms.filter((id) => id !== programId))
  }

  const getComparePrograms = () => {
    return allPrograms.filter((program) => comparePrograms.includes(program.id))
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to the content area, not the top
    const contentElement = document.getElementById("content-area")
    if (contentElement) {
      contentElement.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const { paginatedPrograms, totalPages, totalItems } = useMemo(() => {
    const filtered = allPrograms.filter((program) => {
      const matchesSearch =
        program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = selectedCategory === "All" || program.category === selectedCategory
      const matchesLevel = selectedLevel === "All" || program.level === selectedLevel
      const matchesCertification = selectedCertification === "All" || program.certification === selectedCertification
      const matchesPrice = program.price >= priceRange[0] && program.price <= priceRange[1]
      const matchesFeatured = !showFeaturedOnly || program.featured

      return matchesSearch && matchesCategory && matchesLevel && matchesCertification && matchesPrice && matchesFeatured
    })

    // Sort programs
    switch (sortBy) {
      case "featured":
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "duration":
        filtered.sort((a, b) => a.duration.localeCompare(b.duration))
        break
      default:
        break
    }

    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedPrograms = filtered.slice(startIndex, startIndex + itemsPerPage)

    return { paginatedPrograms, totalPages, totalItems }
  }, [
    searchTerm,
    selectedCategory,
    selectedLevel,
    selectedCertification,
    priceRange,
    showFeaturedOnly,
    allPrograms,
    sortBy,
    comparePrograms,
    currentPage,
    itemsPerPage,
  ])


  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedLevel, selectedCertification, priceRange, showFeaturedOnly, sortBy])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <FloatingHeader />

      {/* Page Header */}
      <div className="bg-white/95 backdrop-blur-md border-b shadow-sm pt-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Training Programs</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover comprehensive emergency response training programs designed to prepare you for real-world
              challenges
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between w-full">
              <div className="relative w-full lg:max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search programs, skills, or certifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg w-full"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-12 px-6">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </Button>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 h-12">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured First</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
                <AddTrainingDialog onSuccess={fetchPrograms} />
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  variants={filterVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-white rounded-xl border shadow-sm p-6 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Certification</label>
                      <Select value={selectedCertification} onValueChange={setSelectedCertification}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {certifications.map((cert) => (
                            <SelectItem key={cert} value={cert}>
                              {cert}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={10000}
                        min={0}
                        step={500}
                        className="mt-3"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="featured" checked={showFeaturedOnly} onCheckedChange={(checked) => setShowFeaturedOnly(checked === true)} />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                      Show featured programs only
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Content Area */}
      <div id="content-area" className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Program Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence>
              {paginatedPrograms.map((program) => (
                <motion.div
                  key={program.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover="hover"
                  layout
                >
                  <Card className="h-full overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="relative">
                      <img
                        src={program.image || "/placeholder.svg"}
                        alt={program.title}
                        className="w-full h-48 object-cover"
                      />
                      {program.featured && (
                        <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600">Featured</Badge>
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">{program.rating}</span>
                        </div>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2">{program.title}</CardTitle>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3 mt-2">{program.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {program.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {program.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{program.tags.length - 2} more
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          {program.duration}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          {program.level}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Award className="w-4 h-4 mr-2" />
                          {program.certification}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {program.location}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">${program.price.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">{program.reviews} reviews</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {comparePrograms.includes(program.id) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCompare(program.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Minus className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToCompare(program.id)}
                              disabled={comparePrograms.length >= 3}
                              className="border-blue-200 text-blue-600 hover:bg-blue-800 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Compare
                            </Button>
                          )}
                          <Link to={`/training/${program.slug}`}>
                            <Button className="bg-red-600 hover:bg-red-700">Learn More</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {totalItems === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No programs found</h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or filters to find more programs.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("All")
                    setSelectedLevel("All")
                    setSelectedCertification("All")
                    setPriceRange([0, 10000])
                    setShowFeaturedOnly(false)
                  }}
                  variant="outline"
                >
                  Clear All Filters
                </Button>
              </div>
            </motion.div>
          )}

          {/* Pagination and Results Info */}
          {totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} programs
                {searchTerm && (
                  <Badge variant="secondary" className="text-sm ml-2">
                    Results for "{searchTerm}"
                  </Badge>
                )}
              </p>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Floating Compare Button */}
      <AnimatePresence>
        {comparePrograms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Sheet open={showComparison} onOpenChange={setShowComparison}>
              <SheetTrigger asChild>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg rounded-full px-6 py-3 h-auto">
                  <Compare className="w-5 h-5 mr-2" />
                  Compare ({comparePrograms.length})
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold mb-6">Program Comparison</SheetTitle>
                </SheetHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getComparePrograms().map((program, index) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg border shadow-sm overflow-hidden"
                    >
                      <div className="relative">
                        <img
                          src={program.image || "/placeholder.svg"}
                          alt={program.title}
                          className="w-full h-32 object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCompare(program.id)}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        {program.featured && <Badge className="absolute top-2 left-2 bg-red-500">Featured</Badge>}
                      </div>

                      <div className="p-4 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-2">{program.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Price</span>
                            <span className="text-lg font-bold text-green-600">${program.price.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Duration</span>
                            <span className="text-sm text-gray-900">{program.duration}</span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Level</span>
                            <Badge variant="secondary" className="text-xs">
                              {program.level}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Certification</span>
                            <span className="text-sm text-gray-900">{program.certification}</span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Location</span>
                            <span className="text-sm text-gray-900">{program.location}</span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Rating</span>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm font-medium">{program.rating}</span>
                              <span className="text-xs text-gray-500 ml-1">({program.reviews})</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Start Date</span>
                            <span className="text-sm text-gray-900">
                              {new Date(program.startDate).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">Instructor</span>
                            <span className="text-sm text-gray-900">{program.instructor}</span>
                          </div>

                          <div className="py-2">
                            <span className="text-sm font-medium text-gray-700 block mb-2">Key Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {program.tags.map((tag, tagIndex) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <Link to={`/training/${program.slug}`} className="w-full">
                            <Button className="w-full bg-red-600 hover:bg-red-700">View Details</Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {comparePrograms.length < 3 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Tip:</strong> You can compare up to 3 programs. Add more programs from the list above to
                      get a better comparison.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex justify-center">
                  <Button variant="outline" onClick={() => setComparePrograms([])} className="px-6">
                    Clear All Comparisons
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}
