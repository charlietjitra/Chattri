import { api } from '../../api-client'
import type { Review } from '@/types'

interface CreateReviewRequest {
  bookingId: string
  tutorId: string
  rating: number
  reviewText?: string
}

export const reviewsApi = {
  create: async (data: CreateReviewRequest): Promise<Review> => {
    const payload = {
      bookingId: data.bookingId,
      tutorId: data.tutorId,
      rating: data.rating,
      reviewText: data.reviewText,
      isPublic: true
    }
    const response = await api.post('/reviews', payload)
    return response.data.review
  },

  getTutorReviews: async (tutorId: string, page = 1, limit = 20): Promise<{ reviews: Review[], pagination: any, averageRating: number, totalReviews: number }> => {
    const response = await api.get(`/reviews/tutor/${tutorId}`, {
      params: { page, limit }
    })
    return response.data
  },

  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews')
    return response.data
  }
}
