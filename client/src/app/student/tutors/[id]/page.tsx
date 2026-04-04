'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { tutorsApi, reviewsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, ArrowLeft, Calendar, Globe, GraduationCap, Briefcase, Video, Loader2, User, MessageSquare } from 'lucide-react'
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
  reviews?: any[]
  availableTimeSlots?: number[]
}

interface ReviewWithStudent {
  id: string
  rating: number
  reviewText: string | null
  createdAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    avatarUrl: string | null
  }
}

export default function TutorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const tutorId = params.id as string

  const [tutor, setTutor] = useState<TutorWithUser | null>(null)
  const [reviews, setReviews] = useState<ReviewWithStudent[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTutorData()
  }, [tutorId])

  const fetchTutorData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const tutorData = await tutorsApi.getById(tutorId)
      setTutor(tutorData)
      const reviewsData = await reviewsApi.getTutorReviews(tutorId, 1, 10)
      setReviews(reviewsData.reviews as any[])
      setAverageRating(reviewsData.averageRating)
      setTotalReviews(reviewsData.totalReviews)
    } catch (err: any) {
      console.error('Fetch tutor error:', err)
      setError(err.response?.data?.error || err.message || 'Failed to load tutor profile')
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const handleBookSession = () => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user?.role !== 'student') {
      alert('Only students can book sessions')
      return
    }
    router.push(`/student/tutors/${tutorId}/book`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#C17F59]" />
        </div>
      </div>
    )
  }

  if (error || !tutor) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Tutor not found'}</p>
            <Button asChild variant="outline" className="border-[#C17F59]/20 text-[#C17F59]">
              <Link href="/student/tutors">Back to Tutors</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      
      <div className="relative container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-[#C17F59] hover:bg-[#C17F59]/5">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Tutor Profile */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-[#C17F59]/5 to-[#7D9D6A]/5 pb-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={tutor.user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] text-white text-3xl">
                      {getInitials(tutor.user?.firstName, tutor.user?.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3 text-[#5C5C5C]">
                      {tutor.user?.firstName} {tutor.user?.lastName}
                    </CardTitle>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-5 w-5 ${i < Math.round(averageRating) ? 'fill-[#D4A853] text-[#D4A853]' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="font-semibold text-lg text-[#5C5C5C]">{averageRating.toFixed(1)}</span>
                      <span className="text-[#5C5C5C]/70">
                        ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-[#5C5C5C]/70">
                      {tutor.yearsExperience && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{tutor.yearsExperience} years experience</span>
                        </div>
                      )}
                      {tutor.user?.timeZone && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <span>{tutor.user.timeZone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                <p className="text-[#5C5C5C]/80 leading-relaxed mb-6">{tutor.bio}</p>

                {tutor.expertise && tutor.expertise.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-[#5C5C5C] mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#C17F59]" />
                      Expertise
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tutor.expertise.map((exp) => (
                        <Badge key={exp} className="bg-[#C17F59]/10 text-[#C17F59] border-0">{exp}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {tutor.teachingLanguages && tutor.teachingLanguages.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-[#5C5C5C] mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#7D9D6A]" />
                      Teaching Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tutor.teachingLanguages.map((lang) => (
                        <Badge key={lang} variant="outline" className="border-[#7D9D6A]/20 text-[#7D9D6A]">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {tutor.education && (
                  <div className="mb-5">
                    <h3 className="text-sm font-semibold text-[#5C5C5C] mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#D4A853]" />
                      Education
                    </h3>
                    <p className="text-[#5C5C5C]/80">{tutor.education}</p>
                  </div>
                )}

                {tutor.videoPlatformLink && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#5C5C5C] mb-2 flex items-center gap-2">
                      <Video className="h-4 w-4 text-[#C17F59]" />
                      Video Platform
                    </h3>
                    <a href={tutor.videoPlatformLink} target="_blank" rel="noopener noreferrer" className="text-[#C17F59] hover:underline">
                      {tutor.videoPlatformLink}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D4A853]/10 rounded-lg">
                    <Star className="h-5 w-5 text-[#D4A853]" />
                  </div>
                  <div>
                    <CardTitle className="text-[#5C5C5C]">Student Reviews</CardTitle>
                    <CardDescription className="text-[#5C5C5C]/70">
                      {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} from students
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-[#C17F59]/50" />
                    </div>
                    <p className="text-[#5C5C5C]/70">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-[#C17F59]/10 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.student.avatarUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-[#7D9D6A] to-[#C17F59] text-white">
                              {getInitials(review.student.firstName, review.student.lastName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-[#5C5C5C]">
                                {review.student.firstName} {review.student.lastName}
                              </span>
                              <span className="text-sm text-[#5C5C5C]/50">{formatDate(review.createdAt)}</span>
                            </div>

                            <div className="flex gap-1 mb-2">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-[#D4A853] text-[#D4A853]' : 'text-gray-300'}`} />
                              ))}
                            </div>

                            {review.reviewText && (
                              <p className="text-[#5C5C5C]/80 text-sm">{review.reviewText}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow sticky top-4">
              <CardHeader className="bg-gradient-to-br from-[#C17F59]/5 to-[#7D9D6A]/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#C17F59]/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-[#C17F59]" />
                  </div>
                  <CardTitle className="text-[#5C5C5C]">Book a Session</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gradient-organic mb-2">{averageRating.toFixed(1)}</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.round(averageRating) ? 'fill-[#D4A853] text-[#D4A853]' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-[#5C5C5C]/70">Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
                </div>

                <Button onClick={handleBookSession} className="w-full bg-[#C17F59] hover:bg-[#B3714F] text-lg py-6 rounded-xl hover-lift">
                  Book a Session
                </Button>

                {!isAuthenticated && (
                  <p className="text-sm text-[#5C5C5C]/70 text-center mt-3">
                    Please{' '}
                    <Link href="/login" className="text-[#C17F59] hover:text-[#B3714F] font-medium">sign in</Link>
                    {' '}to book
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}