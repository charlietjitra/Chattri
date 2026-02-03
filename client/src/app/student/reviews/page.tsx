'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { reviewsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface MyReview {
  id: string
  rating: number
  reviewText?: string | null
  createdAt: string
  tutor: {
    id: string
    bio?: string
  }
  tutorUser?: {
    firstName?: string
    lastName?: string
    avatarUrl?: string | null
  }
}

export default function MyReviewsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [reviews, setReviews] = useState<MyReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    fetchMyReviews()
  }, [isAuthenticated])

  const fetchMyReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await reviewsApi.getMyReviews()
      setReviews(data.reviews || [])
    } catch (err: any) {
      console.error('Failed to load my reviews', err)
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.')
      } else {
        setError(err.response?.data?.error || 'Failed to load reviews')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM dd, yyyy')
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <Button asChild>
            <Link href="/student/tutors">Find Tutors</Link>
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 mb-6">
            <CardContent className="text-red-600">{error}</CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">You haven't written any reviews yet.</p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((rev) => (
              <Card key={rev.id} className="border-purple-200 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={rev.tutorUser?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-200 to-blue-200 text-purple-700">
                          {rev.tutorUser?.firstName?.[0] || 'T'}{rev.tutorUser?.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{rev.tutorUser?.firstName} {rev.tutorUser?.lastName}</div>
                        <div className="text-sm text-gray-500">{formatDate(rev.createdAt)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{rev.rating} / 5</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {rev.reviewText && <p className="text-gray-700 mb-2">{rev.reviewText}</p>}
                  <div className="flex gap-2">
                    <Button asChild size="sm">
                      <Link href={`/student/tutors/${rev.tutor.id}`}>View Tutor</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
