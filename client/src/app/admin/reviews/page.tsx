'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Star, 
  Search, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'

interface Review {
  id: string
  tutorId: string
  studentId: string
  bookingId: string
  rating: number
  reviewText?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  student?: {
    firstName: string
    lastName: string
  }
  tutor?: {
    firstName: string
    lastName: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadReviews()
  }, [pagination.page])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getReviews(pagination.page, pagination.limit)
      setReviews(data.reviews)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await adminApi.deleteReview(reviewId)
      loadReviews()
    } catch (error) {
      console.error('Failed to delete review:', error)
    }
  }

  const filteredReviews = reviews.filter(review => 
    review.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.tutor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.tutor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.reviewText?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-2">({rating}/5)</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage all platform reviews</p>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <span>Reviews ({pagination.total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews</h3>
                <p className="mt-1 text-sm text-gray-500">No reviews found matching your criteria.</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <Card key={review.id} className="border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">#{review.id}</Badge>
                            <div className="flex items-center space-x-2">
                              {review.isPublic ? (
                                <Eye className="w-4 h-4 text-green-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm text-gray-600">
                                {review.isPublic ? 'Public' : 'Private'}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="mb-3">
                          {renderStars(review.rating)}
                        </div>

                        {/* Participants */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Student</div>
                            <div className="text-sm text-gray-600">
                              {review.student?.firstName} {review.student?.lastName}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Tutor</div>
                            <div className="text-sm text-gray-600">
                              {review.tutor?.firstName} {review.tutor?.lastName}
                            </div>
                          </div>
                        </div>

                        {/* Review Text */}
                        {review.reviewText && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-900 mb-2">Review</div>
                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              "{review.reviewText}"
                            </div>
                          </div>
                        )}

                        {/* Booking Reference */}
                        <div className="text-xs text-gray-500">
                          Booking: #{review.bookingId}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete this review? This action cannot be undone.`)) {
                              handleDeleteReview(review.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reviews
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}