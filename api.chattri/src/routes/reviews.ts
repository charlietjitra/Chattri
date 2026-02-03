import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { createReviewSchema } from '../lib/validation.js'
import { generateReviewId } from '../utils/id-generator.js'
import { Role } from '../utils/auth.js'

const reviews = new Hono()

// Create a review (student reviews tutor after session)
reviews.post('/', authMiddleware, requireRole([Role.STUDENT]), async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = createReviewSchema.parse(body)

    // Verify the booking exists and belongs to the student
    const booking = await db.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        session: true
      }
    })

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404)
    }

    if (booking.studentId !== user.metaId) {
      return c.json({ error: 'Not authorized to review this booking' }, 403)
    }

    if (booking.tutorId !== validatedData.tutorId) {
      return c.json({ error: 'Tutor ID does not match booking' }, 400)
    }

    if (booking.status !== 'completed') {
      return c.json({ error: 'Can only review completed sessions' }, 400)
    }

    // Check if review already exists for this booking
    const existingReview = await db.review.findUnique({
      where: { bookingId: validatedData.bookingId }
    })

    if (existingReview) {
      return c.json({ error: 'Review already exists for this booking' }, 400)
    }

    // Create the review
    const review = await db.review.create({
      data: {
        id: generateReviewId(),
        tutorId: validatedData.tutorId,
        studentId: user.metaId,
        bookingId: validatedData.bookingId,
        rating: validatedData.rating,
        reviewText: validatedData.reviewText,
        isPublic: validatedData.isPublic
      }
    })

    return c.json({
      message: 'Review created successfully',
      review
    }, 201)

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Create review error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get reviews for a specific tutor
reviews.get('/tutor/:tutorId', async (c) => {
  try {
    const tutorId = c.req.param('tutorId')
    const query = c.req.query()
    const page = parseInt(query.page || '1')
    const limit = Math.min(parseInt(query.limit || '20'), 50)
    const skip = (page - 1) * limit

    // Verify tutor exists
    const tutor = await db.tutor.findUnique({
      where: { id: tutorId }
    })

    if (!tutor) {
      return c.json({ error: 'Tutor not found' }, 404)
    }

    // Get reviews with student data
    const reviews = await db.review.findMany({
      where: { 
        tutorId,
        isPublic: true 
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true
          }
        }
      }
    })

    // Get student user data for each review and normalize shape
    const reviewsWithUserData = await Promise.all(
      reviews.map(async (review) => {
        const studentUser = await db.user.findFirst({
          where: { metaType: 'student', metaId: review.studentId },
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        })

        return {
          id: review.id,
          rating: review.rating,
          reviewText: review.reviewText,
          createdAt: review.createdAt,
          student: {
            id: review.studentId,
            firstName: studentUser?.firstName || 'Anonymous',
            lastName: studentUser?.lastName || '',
            avatarUrl: studentUser?.avatarUrl || null
          }
        }
      })
    )

    // Get total count and calculate average rating
    const totalReviews = await db.review.count({
      where: { tutorId, isPublic: true }
    })

    const allRatings = await db.review.findMany({
      where: { tutorId, isPublic: true },
      select: { rating: true }
    })

    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
      : 0

    return c.json({
      reviews: reviewsWithUserData,
      pagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit)
      },
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: allRatings.length
    })

  } catch (error) {
    console.error('Get tutor reviews error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get reviews written by current user (student)
reviews.get('/my-reviews', authMiddleware, requireRole([Role.STUDENT]), async (c) => {
  try {
    const user = c.get('user')

    const reviews = await db.review.findMany({
      where: { studentId: user.metaId },
      orderBy: { createdAt: 'desc' },
      include: {
        tutor: {
          select: {
            id: true,
            bio: true
          }
        },
        booking: {
          select: {
            scheduledStartTime: true,
            scheduledEndTime: true
          }
        }
      }
    })

    // Normalize reviews to a stable frontend-friendly shape
    const reviewsWithTutorData = await Promise.all(
      reviews.map(async (review) => {
        const tutorUser = await db.user.findFirst({
          where: { metaType: 'tutor', metaId: review.tutorId },
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        })

        return {
          id: review.id,
          rating: review.rating,
          reviewText: review.reviewText,
          createdAt: review.createdAt,
          // include booking info for traceability
          booking: review.booking || null,
          // tutor summary for frontend convenience
          tutor: {
            id: review.tutorId,
            firstName: tutorUser?.firstName || 'Tutor',
            lastName: tutorUser?.lastName || '',
            avatarUrl: tutorUser?.avatarUrl || null,
          }
        }
      })
    )

    return c.json({ reviews: reviewsWithTutorData })

  } catch (error) {
    console.error('Get my reviews error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default reviews