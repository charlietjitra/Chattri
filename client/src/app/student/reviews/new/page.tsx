'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { reviewsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Star, ArrowLeft, Loader2 } from 'lucide-react'

export default function NewReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const bookingId = searchParams.get('booking')
  const tutorId = searchParams.get('tutor')

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated])

  const submitReview = async () => {
    if (!bookingId || !tutorId) return setError('Missing booking or tutor information')
    try {
      setLoading(true)
      setError(null)
      await reviewsApi.create({ bookingId, tutorId: tutorId || '', rating, reviewText: comment })
      // Prefetch tutor profile
      if (tutorId) {
        router.prefetch(`/student/tutors/${tutorId}`)
      }
      // Show simple toast
      setToast('Review submitted successfully')
      setTimeout(() => {
        router.push('/student/bookings')
      }, 800)
    } catch (err: any) {
      console.error('Failed to submit review', err)
      setError(err.response?.data?.error || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

  <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Leave a Review</CardTitle>
            <CardDescription>Share your feedback about the session and tutor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRating(v)}
                      className={`p-2 rounded ${rating >= v ? 'text-yellow-400' : 'text-gray-300'}`}
                      aria-label={`${v} star`}
                    >
                      <Star className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {error && <div className="text-red-600">{error}</div>}

              <div className="flex gap-2">
                <Button onClick={submitReview} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Review'}
                </Button>
                <Button variant="outline" onClick={() => router.push('/student/bookings')}>Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Simple toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
