'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { reviewsApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Star, ArrowLeft, Loader2, MessageSquare, Send } from 'lucide-react'

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
  }, [isAuthenticated, router])

  const submitReview = async () => {
    if (!bookingId || !tutorId) return setError('Missing booking or tutor information')
    try {
      setLoading(true)
      setError(null)
      await reviewsApi.create({ bookingId, tutorId: tutorId || '', rating, reviewText: comment })
      if (tutorId) router.prefetch(`/student/tutors/${tutorId}`)
      setToast('Review submitted successfully')
      setTimeout(() => router.push('/student/bookings'), 800)
    } catch (err: any) {
      console.error('Failed to submit review', err)
      setError(err.response?.data?.error || 'Failed to submit review')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) return null

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

        <Card className="max-w-2xl mx-auto border-0 bg-white/60 backdrop-blur-sm organic-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#C17F59]/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-[#C17F59]" />
              </div>
              <div>
                <CardTitle className="text-[#5C5C5C]">Leave a Review</CardTitle>
                <CardDescription className="text-[#5C5C5C]/70">Share your feedback about the session and tutor</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#5C5C5C] mb-3">How was your session?</label>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRating(v)}
                      className={`p-2 rounded-xl transition-all duration-200 ${rating >= v ? 'text-[#D4A853] scale-110' : 'text-gray-300 hover:text-[#D4A853]/50'}`}
                      aria-label={`${v} star`}
                    >
                      <Star className={`h-8 w-8 ${rating >= v ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-[#5C5C5C]/70 mt-2">
                  {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5C5C5C] mb-2">Your comments (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                  className="w-full px-4 py-3 border border-[#C17F59]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C17F59]/20 focus:border-[#C17F59] bg-white/80 min-h-[120px]"
                  placeholder="Share your experience with the tutor..."
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={submitReview} disabled={loading} className="bg-[#C17F59] hover:bg-[#B3714F] hover-lift">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Review
                </Button>
                <Button variant="outline" onClick={() => router.push('/student/bookings')} className="border-[#7D9D6A]/20 text-[#7D9D6A] hover:bg-[#7D9D6A]/5">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {toast && (
          <div className="fixed bottom-6 right-6 bg-[#7D9D6A] text-white px-6 py-3 rounded-xl shadow-lg organic-shadow">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}