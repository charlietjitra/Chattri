"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { reviewsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Star, Loader2, ArrowLeft } from 'lucide-react'
import { useTutor } from '../TutorContext'

interface ReviewItem {
  id: string
  rating: number
  reviewText?: string | null
  createdAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string | null
  }
}

export default function TutorReviewsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  // TutorContext provides tutor info asynchronously; guard for undefined
  const { tutor } = useTutor()
  console.log('Tutor in reviews:', tutor)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'tutor') {
      router.push('/')
      return
    }

    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, page])

  const fetchReviews = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      setError(null)
      // Determine tutorId from authenticated user object
      // Auth user may include a nested `tutor` object (from AuthResponse) or just an `id`.
      const tutorId = (user as any)?.tutor?.id || (user as any)?.metaId || user.id
      const data = await reviewsApi.getTutorReviews(tutorId, page, limit)

      setReviews(data.reviews || [])
      setAverageRating(data.averageRating || 0)
      setTotalReviews(data.totalReviews || 0)
    } catch (err: any) {
      console.error('Failed to load tutor reviews', err)
      setError(err?.response?.data?.error || err.message || 'Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
    ))
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Reviews</CardTitle>
                <CardDescription>
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} • {averageRating.toFixed(1)} average
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : error ? (
                  <div className="text-red-600">{error}</div>
                ) : reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={r.student.avatarUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-200 to-blue-200 text-purple-700">
                              {`${r.student.firstName?.[0] || ''}${r.student.lastName?.[0] || ''}`.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">
                                {r.student.firstName} {r.student.lastName}
                              </span>
                              <span className="text-sm text-gray-500">{formatDate(r.createdAt)}</span>
                            </div>

                            <div className="flex gap-1 mb-2">{renderStars(r.rating)}</div>

                            {r.reviewText && <p className="text-gray-700 text-sm">{r.reviewText}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!isLoading && !error && totalReviews > limit && (
                  <div className="flex items-center justify-between mt-6">
                    <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="outline">
                      Previous
                    </Button>
                    <div className="text-sm text-gray-600">Page {page}</div>
                    <Button onClick={() => setPage((p) => p + 1)} disabled={reviews.length < limit} variant="outline">
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-purple-200 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Overview</CardTitle>
                <CardDescription>Summary of your student reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center gap-1 mb-1">{renderStars(Math.round(averageRating))}</div>
                  <p className="text-sm text-gray-600">Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
                </div>

                <div className="mt-4">
                  <Link href="/tutor/dashboard">
                    <Button variant="outline" className="w-full">Back to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
