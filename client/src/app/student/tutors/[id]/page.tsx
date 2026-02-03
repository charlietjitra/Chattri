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
import { Star, ArrowLeft, Calendar, Globe, GraduationCap, Briefcase, Video, Loader2 } from 'lucide-react'
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

      // Fetch tutor profile
      const tutorData = await tutorsApi.getById(tutorId)
      setTutor(tutorData)

      // Fetch reviews
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
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

    // Navigate to booking page (we'll create this next)
    router.push(`/student/tutors/${tutorId}/book`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error || !tutor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Tutor not found'}</p>
          <Button asChild variant="outline">
            <Link href="/student/tutors">Back to Tutors</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Tutor Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <Card className="border-purple-200 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex flex-col md:flex-row gap-6">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={tutor.user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-3xl">
                      {getInitials(tutor.user?.firstName, tutor.user?.lastName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2">
                      {tutor.user?.firstName} {tutor.user?.lastName}
                    </CardTitle>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex gap-1">
                        {renderStars(Math.round(averageRating))}
                      </div>
                      <span className="font-semibold text-lg">{averageRating.toFixed(1)}</span>
                      <span className="text-gray-600">
                        ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>

                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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
                <p className="text-gray-700 leading-relaxed mb-6">{tutor.bio}</p>

                {/* Expertise */}
                {tutor.expertise && tutor.expertise.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Expertise
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tutor.expertise.map((exp, idx) => (
                        <Badge
                          key={idx}
                          className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200"
                        >
                          {exp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {tutor.teachingLanguages && tutor.teachingLanguages.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Teaching Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tutor.teachingLanguages.map((lang, idx) => (
                        <Badge key={idx} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {tutor.education && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Education
                    </h3>
                    <p className="text-gray-700">{tutor.education}</p>
                  </div>
                )}

                {/* Video Platform */}
                {tutor.videoPlatformLink && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Platform
                    </h3>
                    <a
                      href={tutor.videoPlatformLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline"
                    >
                      {tutor.videoPlatformLink}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  Student Reviews
                </CardTitle>
                <CardDescription>
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} from students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.student.avatarUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-200 to-blue-200 text-purple-700">
                              {getInitials(review.student.firstName, review.student.lastName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">
                                {review.student.firstName} {review.student.lastName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>

                            <div className="flex gap-1 mb-2">
                              {renderStars(review.rating)}
                            </div>

                            {review.reviewText && (
                              <p className="text-gray-700 text-sm">{review.reviewText}</p>
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
            <Card className="border-purple-200 shadow-lg sticky top-4">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Book a Session
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center gap-1 mb-1">
                      {renderStars(Math.round(averageRating))}
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleBookSession}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
                >
                  Book a Session
                </Button>

                {!isAuthenticated && (
                  <p className="text-sm text-gray-600 text-center mt-3">
                    Please{' '}
                    <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                      sign in
                    </Link>{' '}
                    to book a session
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
