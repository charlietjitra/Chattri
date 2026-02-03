'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { tutorsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { Tutor } from '@/types'

interface TutorWithUser extends Tutor {
  user?: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
    timeZone: string
  }
  averageRating?: number
  totalReviews?: number
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState<TutorWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('')
  const [selectedExpertise, setSelectedExpertise] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTutors, setTotalTutors] = useState(0)

  // Extract unique languages and expertise from all tutors
  const [allLanguages, setAllLanguages] = useState<string[]>([])
  const [allExpertise, setAllExpertise] = useState<string[]>([])

  // Fetch all options on mount
  useEffect(() => {
    fetchAllOptions()
  }, [])

  // Fetch tutors when filters change
  useEffect(() => {
    fetchTutors()
  }, [currentPage, selectedLanguage, selectedExpertise])

  const fetchAllOptions = async () => {
    try {
      // Fetch all tutors without filters to get all available options (max 50 per backend limit)
      const response = await tutorsApi.list({ page: 1, limit: 50 })
      
      const languages = new Set<string>()
      const expertise = new Set<string>()

      response.tutors.forEach(tutor => {
        tutor.teachingLanguages?.forEach(lang => languages.add(lang))
        tutor.expertise?.forEach(exp => expertise.add(exp))
      })

      setAllLanguages(Array.from(languages).sort())
      setAllExpertise(Array.from(expertise).sort())
    } catch (err) {
      console.error('Failed to load filter options:', err)
    }
  }

  const fetchTutors = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params: any = {
        page: currentPage,
        limit: 12,
      }

      if (selectedLanguage) {
        params.language = selectedLanguage
      }

      if (selectedExpertise) {
        params.expertise = selectedExpertise
      }

      const response = await tutorsApi.list(params)
      setTutors(response.tutors)
      setTotalPages(response.pagination.totalPages)
      setTotalTutors(response.pagination.total)
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.')
      } else {
        setError(err.message || 'Failed to load tutors')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchTutors()
  }

  const handleFilterChange = (type: 'language' | 'expertise', value: string) => {
    setCurrentPage(1)
    if (type === 'language') {
      setSelectedLanguage(value === selectedLanguage ? '' : value)
    } else {
      setSelectedExpertise(value === selectedExpertise ? '' : value)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedLanguage('')
    setSelectedExpertise('')
    setCurrentPage(1)
  }

  const filteredTutors = tutors.filter(tutor => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    const fullName = `${tutor.user?.firstName} ${tutor.user?.lastName}`.toLowerCase()
    const bioMatch = tutor.bio?.toLowerCase().includes(searchLower)
    const nameMatch = fullName.includes(searchLower)
    const expertiseMatch = tutor.expertise?.some(exp => 
      exp.toLowerCase().includes(searchLower)
    )
    
    return nameMatch || bioMatch || expertiseMatch
  })

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Find Your Perfect Tutor
          </h1>
          <p className="text-gray-600">
            Browse {totalTutors} expert tutors ready to help you achieve your learning goals
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, expertise, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Languages:</span>
            {allLanguages.map(lang => (
              <Badge
                key={lang}
                variant={selectedLanguage === lang ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedLanguage === lang 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : 'hover:bg-purple-50'
                }`}
                onClick={() => handleFilterChange('language', lang)}
              >
                {lang}
              </Badge>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Expertise:</span>
            {allExpertise.map(exp => (
              <Badge
                key={exp}
                variant={selectedExpertise === exp ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  selectedExpertise === exp 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                    : 'hover:bg-blue-50'
                }`}
                onClick={() => handleFilterChange('expertise', exp)}
              >
                {exp}
              </Badge>
            ))}
          </div>

          {(selectedLanguage || selectedExpertise || searchQuery) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearFilters}
              className="text-purple-600 hover:text-purple-700"
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTutors}>Try Again</Button>
          </div>
        )}

        {/* Tutors Grid */}
        {!isLoading && !error && (
          <>
            {filteredTutors.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-600 mb-4">No tutors found matching your criteria.</p>
                <Button onClick={clearFilters} variant="outline">Clear Filters</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredTutors.map((tutor) => (
                  <Card 
                    key={tutor.id} 
                    className="hover:shadow-xl transition-shadow border-purple-100 overflow-hidden"
                  >
                    <CardHeader className="bg-gradient-to-br from-purple-50 to-blue-50 pb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                          <AvatarImage src={tutor.user?.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-lg">
                            {getInitials(tutor.user?.firstName, tutor.user?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">
                            {tutor.user?.firstName} {tutor.user?.lastName}
                          </CardTitle>
                          {tutor.averageRating !== undefined && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{tutor.averageRating.toFixed(1)}</span>
                              <span className="text-gray-500">
                                ({tutor.totalReviews} {tutor.totalReviews === 1 ? 'review' : 'reviews'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <CardDescription className="mb-4 line-clamp-3 text-sm">
                        {tutor.bio}
                      </CardDescription>

                      {/* Expertise */}
                      {tutor.expertise && tutor.expertise.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Expertise:</p>
                          <div className="flex flex-wrap gap-1">
                            {tutor.expertise.slice(0, 3).map((exp, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {exp}
                              </Badge>
                            ))}
                            {tutor.expertise.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{tutor.expertise.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Languages */}
                      {tutor.teachingLanguages && tutor.teachingLanguages.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Languages:</p>
                          <div className="flex flex-wrap gap-1">
                            {tutor.teachingLanguages.map((lang, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {tutor.yearsExperience && (
                        <p className="text-xs text-gray-600">
                          {tutor.yearsExperience} {tutor.yearsExperience === 1 ? 'year' : 'years'} of experience
                        </p>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button 
                        asChild 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Link href={`/student/tutors/${tutor.id}`}>
                          View Profile
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? 'bg-gradient-to-r from-purple-600 to-blue-600' : ''}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
