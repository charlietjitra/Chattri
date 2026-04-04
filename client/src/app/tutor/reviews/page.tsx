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
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      
      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="text-[#C17F59] hover:bg-[#C17F59]/5">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
              <CardHeader className="bg-gradient-to-br from-[#C17F59]/5 to-[#7D9D6A]/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#D4A853]/10 rounded-lg">
                    <Star className="h-5 w-5 text-[#D4A853]" />
                  </div>
                  <div>
                    <CardTitle className="text-[#5C5C5C]">Reviews</CardTitle>
                    <CardDescription className="text-[#5C5C5C]/70">
                      {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} • {averageRating.toFixed(1)} average
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-[#C17F59]" />
                  </div>
                ) : error ? (
                  <div className="text-red-600">{error}</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-[#C17F59]/50" />
                    </div>
                    <p className="text-[#5C5C5C]/70">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="border-b border-[#C17F59]/10 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={r.student.avatarUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-[#7D9D6A] to-[#C17F59] text-white">
                              {`${r.student.firstName?.[0] || ''}${r.student.lastName?.[0] || ''}`.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-[#5C5C5C]">
                                {r.student.firstName} {r.student.lastName}
                              </span>
                              <span className="text-sm text-[#5C5C5C]/50">{formatDate(r.createdAt)}</span>
                            </div>

                            <div className="flex gap-1 mb-2">{renderStars(r.rating)}</div>

                            {r.reviewText && <p className="text-[#5C5C5C]/80 text-sm">{r.reviewText}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!isLoading && !error && totalReviews > limit && (
                  <div className="flex items-center justify-between mt-6">
                    <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} variant="outline" className="border-[#C17F59]/20 text-[#C17F59] hover:bg-[#C17F59]/5">
                      Previous
                    </Button>
                    <div className="text-sm text-[#5C5C5C]/70">Page {page}</div>
                    <Button onClick={() => setPage((p) => p + 1)} disabled={reviews.length < limit} variant="outline" className="border-[#C17F59]/20 text-[#C17F59] hover:bg-[#C17F59]/5">
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow sticky top-4">
              <CardHeader className="bg-gradient-to-br from-[#C17F59]/5 to-[#7D9D6A]/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#C17F59]/10 rounded-lg">
                    <Star className="h-5 w-5 text-[#C17F59]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[#5C5C5C]">Overview</CardTitle>
                    <CardDescription className="text-[#5C5C5C]/70">Summary of your student reviews</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-gradient-organic mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex justify-center gap-1 mb-1">{renderStars(Math.round(averageRating))}</div>
                  <p className="text-sm text-[#5C5C5C]/70">Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
                </div>

                <div className="mt-4">
                  <Link href="/tutor/dashboard">
                    <Button variant="outline" className="w-full border-[#7D9D6A]/20 text-[#7D9D6A] hover:bg-[#7D9D6A]/5">Back to Dashboard</Button>
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
