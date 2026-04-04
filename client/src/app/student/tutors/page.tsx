'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { tutorsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Star, ChevronLeft, ChevronRight, Loader2, GraduationCap, Users } from 'lucide-react'
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

  const [allLanguages, setAllLanguages] = useState<string[]>([])
  const [allExpertise, setAllExpertise] = useState<string[]>([])

  useEffect(() => {
    fetchAllOptions()
  }, [])

  useEffect(() => {
    fetchTutors()
  }, [currentPage, selectedLanguage, selectedExpertise])

  const fetchAllOptions = async () => {
    try {
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
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C17F59]/10 rounded-full mb-4">
            <GraduationCap className="h-4 w-4 text-[#C17F59]" />
            <span className="text-sm font-medium text-[#C17F59]">Find Your Tutor</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-[#5C5C5C]">Find Your Perfect Tutor</h1>
          <p className="text-[#5C5C5C]/70">
            Browse {totalTutors} expert tutors ready to help you achieve your learning goals
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5C5C]/50" />
              <Input
                type="text"
                placeholder="Search by name, expertise, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-11 border-[#C17F59]/20 focus:border-[#C17F59] focus:ring-[#C17F59]/20 bg-white/80"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="bg-[#C17F59] hover:bg-[#B3714F] px-6"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-[#5C5C5C]">Languages:</span>
            {allLanguages.map(lang => (
              <Badge
                key={lang}
                variant={selectedLanguage === lang ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedLanguage === lang 
                    ? 'bg-[#C17F59] hover:bg-[#B3714F] text-white' 
                    : 'border-[#C17F59]/20 text-[#5C5C5C] hover:bg-[#C17F59]/5 hover:border-[#C17F59]/40'
                }`}
                onClick={() => handleFilterChange('language', lang)}
              >
                {lang}
              </Badge>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-[#5C5C5C]">Expertise:</span>
            {allExpertise.map(exp => (
              <Badge
                key={exp}
                variant={selectedExpertise === exp ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedExpertise === exp 
                    ? 'bg-[#7D9D6A] hover:bg-[#6D8C5A] text-white' 
                    : 'border-[#7D9D6A]/20 text-[#5C5C5C] hover:bg-[#7D9D6A]/5 hover:border-[#7D9D6A]/40'
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
              className="text-[#C17F59] hover:text-[#B3714F] hover:bg-[#C17F59]/5"
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#C17F59]" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchTutors} className="bg-[#C17F59] hover:bg-[#B3714F]">Try Again</Button>
          </div>
        )}

        {/* Tutors Grid */}
        {!isLoading && !error && (
          <>
            {filteredTutors.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-[#C17F59]/50" />
                </div>
                <p className="text-[#5C5C5C]/70 mb-4">No tutors found matching your criteria.</p>
                <Button onClick={clearFilters} variant="outline" className="border-[#C17F59]/20 text-[#C17F59]">Clear Filters</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredTutors.map((tutor) => (
                  <Card 
                    key={tutor.id} 
                    className="hover-lift organic-shadow border-0 bg-white/60 backdrop-blur-sm overflow-hidden group"
                  >
                    <CardHeader className="bg-gradient-to-br from-[#C17F59]/5 to-[#7D9D6A]/5 pb-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                          <AvatarImage src={tutor.user?.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] text-white text-lg">
                            {getInitials(tutor.user?.firstName, tutor.user?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1 text-[#5C5C5C]">
                            {tutor.user?.firstName} {tutor.user?.lastName}
                          </CardTitle>
                          {tutor.averageRating !== undefined && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-[#D4A853] text-[#D4A853]" />
                              <span className="font-semibold text-[#5C5C5C]">{tutor.averageRating.toFixed(1)}</span>
                              <span className="text-[#5C5C5C]/50">
                                ({tutor.totalReviews} {tutor.totalReviews === 1 ? 'review' : 'reviews'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                      <CardDescription className="mb-4 line-clamp-3 text-sm text-[#5C5C5C]/70">
                        {tutor.bio}
                      </CardDescription>

                      {tutor.expertise && tutor.expertise.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-[#5C5C5C]/70 mb-1">Expertise:</p>
                          <div className="flex flex-wrap gap-1">
                            {tutor.expertise.slice(0, 3).map((exp) => (
                              <Badge key={exp} className="text-xs bg-[#C17F59]/10 text-[#C17F59] border-0">
                                {exp}
                              </Badge>
                            ))}
                            {tutor.expertise.length > 3 && (
                              <Badge className="text-xs bg-[#5C5C5C]/10 text-[#5C5C5C]/70 border-0">
                                +{tutor.expertise.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {tutor.teachingLanguages && tutor.teachingLanguages.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-[#5C5C5C]/70 mb-1">Languages:</p>
                          <div className="flex flex-wrap gap-1">
                            {tutor.teachingLanguages.map((lang) => (
                              <Badge key={lang} variant="outline" className="text-xs border-[#7D9D6A]/20 text-[#7D9D6A]">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {tutor.yearsExperience && (
                        <p className="text-xs text-[#5C5C5C]/50">
                          {tutor.yearsExperience} {tutor.yearsExperience === 1 ? 'year' : 'years'} of experience
                        </p>
                      )}
                    </CardContent>

                    <CardFooter>
                      <Button 
                        asChild 
                        className="w-full bg-[#C17F59] hover:bg-[#B3714F] hover-lift"
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
                  className="border-[#C17F59]/20 text-[#C17F59] hover:bg-[#C17F59]/5"
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
                        className={currentPage === pageNum ? 'bg-[#C17F59] hover:bg-[#B3714F]' : 'border-[#C17F59]/20 text-[#C17F59]'}
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
                  className="border-[#C17F59]/20 text-[#C17F59] hover:bg-[#C17F59]/5"
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