import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'
import { createTutorSchema } from '../lib/validation.js'
import { generateUserId, generateTutorId } from '../utils/id-generator.js'
import { hashPassword } from '../utils/auth.js'
import { createTutorTimeSlots, updateTutorAvailability } from '../utils/availability.js'

const admin = new Hono()

// Create tutor (admin only)
admin.post('/tutors', authMiddleware, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = createTutorSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 400)
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Generate IDs
    const userId = generateUserId()
    const tutorId = generateTutorId()

    // Create tutor profile
    const tutor = await db.tutor.create({
      data: {
        id: tutorId,
        bio: validatedData.bio,
        expertise: validatedData.expertise,
        videoPlatformLink: validatedData.videoPlatformLink,
        teachingLanguages: validatedData.teachingLanguages,
        yearsExperience: validatedData.yearsExperience || null,
        education: validatedData.education || null,
      }
    })

    // Create user
    const user = await db.user.create({
      data: {
        id: userId,
        email: validatedData.email,
        passwordHash,
        metaType: 'tutor',
        metaId: tutor.id,
        firstName: body.firstName,
        lastName: body.lastName,
        timeZone: body.timeZone || 'UTC',
      }
    })

    // Initialize tutor's 24-hour time slots
    await createTutorTimeSlots(tutor.id)
    
    // Set initial availability if provided
    if (validatedData.availableHours && validatedData.availableHours.length > 0) {
      await updateTutorAvailability(tutor.id, validatedData.availableHours)
    }

    return c.json({
      message: 'Tutor created successfully',
      tutor: {
        id: tutor.id,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        bio: tutor.bio,
        expertise: tutor.expertise,
        videoPlatformLink: tutor.videoPlatformLink,
        teachingLanguages: tutor.teachingLanguages,
      }
    }, 201)

  } catch (error) {
    console.error('Create tutor error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Delete tutor (admin only)
admin.delete('/tutors/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const tutorId = c.req.param('id')

    // Find the user associated with this tutor
    const user = await db.user.findFirst({
      where: {
        metaType: 'tutor',
        metaId: tutorId
      }
    })

    if (!user) {
      return c.json({ error: 'Tutor not found' }, 404)
    }

    // Delete tutor and user in transaction
    await db.$transaction([
      db.tutor.delete({ where: { id: tutorId } }),
      db.user.delete({ where: { id: user.id } })
    ])

    return c.json({
      message: 'Tutor deleted successfully'
    })

  } catch (error) {
    console.error('Delete tutor error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// List all users (admin only)
admin.get('/users', authMiddleware, requireAdmin, async (c) => {
  try {
    const query = c.req.query()
    const page = parseInt(query.page || '1')
    const limit = Math.min(parseInt(query.limit || '50'), 100)
    const skip = (page - 1) * limit
    const role = query.role // Filter by role

    const where: any = {}
    if (role && ['student', 'tutor', 'admin'].includes(role)) {
      where.metaType = role
    }

    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          metaType: true,
          metaId: true,
          timeZone: true,
          isVerified: true,
          isActive: true,
          createdAt: true
        }
      }),
      db.user.count({ where })
    ])

    return c.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('List users error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get dashboard stats (admin only)
admin.get('/stats', authMiddleware, requireAdmin, async (c) => {
  try {
    const [
      totalStudents,
      totalTutors,
      totalBookings,
      totalReviews,
      activeSessionsCount,
      pendingBookings,
      completedBookings,
      cancelledBookings
    ] = await Promise.all([
      db.user.count({ where: { metaType: 'student', isActive: true } }),
      db.user.count({ where: { metaType: 'tutor', isActive: true } }),
      db.booking.count(),
      db.review.count(),
      db.session.count({ where: { status: 'active' } }),
      db.booking.count({ where: { status: 'pending' } }),
      db.booking.count({ where: { status: 'completed' } }),
      db.booking.count({ where: { status: 'cancelled' } })
    ])

    // Get recent activities
    const recentBookings = await db.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        scheduledStartTime: true,
        createdAt: true,
        studentId: true,
        tutorId: true
      }
    })

    // Get user info for the bookings
    const studentIds = recentBookings.map(b => b.studentId)
    const tutorIds = recentBookings.map(b => b.tutorId)
    
    const [studentUsers, tutorUsers] = await Promise.all([
      db.user.findMany({
        where: { metaType: 'student', metaId: { in: studentIds } },
        select: { metaId: true, firstName: true, lastName: true }
      }),
      db.user.findMany({
        where: { metaType: 'tutor', metaId: { in: tutorIds } },
        select: { metaId: true, firstName: true, lastName: true }
      })
    ])

    const studentMap = new Map(studentUsers.map(u => [u.metaId, u]))
    const tutorMap = new Map(tutorUsers.map(u => [u.metaId, u]))

    const enrichedBookings = recentBookings.map(booking => ({
      ...booking,
      student: studentMap.get(booking.studentId),
      tutor: tutorMap.get(booking.tutorId)
    }))

    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        metaType: true,
        createdAt: true
      }
    })

    // Get revenue data (if you have pricing)
    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)
    
    const monthlyBookings = await db.booking.count({
      where: {
        createdAt: { gte: thisMonth },
        status: { in: ['confirmed', 'completed'] }
      }
    })

    return c.json({
      stats: {
        totalStudents,
        totalTutors,
        totalBookings,
        totalReviews,
        activeSessions: activeSessionsCount,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        monthlyBookings
      },
      recentBookings: enrichedBookings,
      recentUsers
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// User management endpoints
admin.get('/users/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id')
    
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    let additionalData = null
    if (user.metaType === 'student') {
      additionalData = await db.student.findUnique({
        where: { id: user.metaId },
        include: {
          bookings: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    } else if (user.metaType === 'tutor') {
      additionalData = await db.tutor.findUnique({
        where: { id: user.metaId },
        include: {
          bookings: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    }

    return c.json({ 
      user: {
        ...user,
        additionalData
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

admin.put('/users/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id')
    const body = await c.req.json()

    const user = await db.user.update({
      where: { id: userId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        isActive: body.isActive,
        isVerified: body.isVerified,
        timeZone: body.timeZone
      }
    })

    return c.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

admin.delete('/users/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id')

    // Delete user and associated data
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } })
      if (!user) throw new Error('User not found')

      // Delete associated records based on user type
      if (user.metaType === 'student' && user.metaId) {
        await tx.student.delete({ where: { id: user.metaId } })
      } else if (user.metaType === 'tutor' && user.metaId) {
        await tx.tutor.delete({ where: { id: user.metaId } })
      }

      await tx.user.delete({ where: { id: userId } })
    })

    return c.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Booking management endpoints
admin.get('/bookings', authMiddleware, requireAdmin, async (c) => {
  try {
    const query = c.req.query()
    const page = parseInt(query.page || '1')
    const limit = Math.min(parseInt(query.limit || '20'), 100)
    const skip = (page - 1) * limit
    const status = query.status

    const where: any = {}
    if (status) {
      where.status = status
    }

    const [bookings, totalCount] = await Promise.all([
      db.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          studentId: true,
          tutorId: true,
          scheduledStartTime: true,
          scheduledEndTime: true,
          status: true,
          cancellationReason: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      db.booking.count({ where })
    ])

    // Get user info for the bookings
    const bookingStudentIds = bookings.map(b => b.studentId)
    const bookingTutorIds = bookings.map(b => b.tutorId)
    
    const [bookingStudentUsers, bookingTutorUsers] = await Promise.all([
      db.user.findMany({
        where: { metaType: 'student', metaId: { in: bookingStudentIds } },
        select: { metaId: true, firstName: true, lastName: true, email: true }
      }),
      db.user.findMany({
        where: { metaType: 'tutor', metaId: { in: bookingTutorIds } },
        select: { metaId: true, firstName: true, lastName: true, email: true }
      })
    ])

    const bookingStudentMap = new Map(bookingStudentUsers.map(u => [u.metaId, u]))
    const bookingTutorMap = new Map(bookingTutorUsers.map(u => [u.metaId, u]))

    const enrichedBookingsResult = bookings.map(booking => ({
      ...booking,
      student: bookingStudentMap.get(booking.studentId),
      tutor: bookingTutorMap.get(booking.tutorId)
    }))

    return c.json({
      bookings: enrichedBookingsResult,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Get bookings error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

admin.put('/bookings/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const bookingId = c.req.param('id')
    const body = await c.req.json()

    const booking = await db.booking.update({
      where: { id: bookingId },
      data: {
        status: body.status,
        scheduledStartTime: body.scheduledStartTime ? new Date(body.scheduledStartTime) : undefined,
        scheduledEndTime: body.scheduledEndTime ? new Date(body.scheduledEndTime) : undefined,
        cancellationReason: body.cancellationReason
      }
    })

    return c.json({ booking })
  } catch (error) {
    console.error('Update booking error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

admin.delete('/bookings/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const bookingId = c.req.param('id')

    await db.booking.delete({ where: { id: bookingId } })
    return c.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Delete booking error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Review management endpoints
admin.get('/reviews', authMiddleware, requireAdmin, async (c) => {
  try {
    const query = c.req.query()
    const page = parseInt(query.page || '1')
    const limit = Math.min(parseInt(query.limit || '20'), 100)
    const skip = (page - 1) * limit

    const [reviews, totalCount] = await Promise.all([
      db.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          tutorId: true,
          studentId: true,
          bookingId: true,
          rating: true,
          reviewText: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      db.review.count()
    ])

    // Get user info for the reviews
    const reviewStudentIds = reviews.map(r => r.studentId)
    const reviewTutorIds = reviews.map(r => r.tutorId)
    
    const [reviewStudentUsers, reviewTutorUsers] = await Promise.all([
      db.user.findMany({
        where: { metaType: 'student', metaId: { in: reviewStudentIds } },
        select: { metaId: true, firstName: true, lastName: true }
      }),
      db.user.findMany({
        where: { metaType: 'tutor', metaId: { in: reviewTutorIds } },
        select: { metaId: true, firstName: true, lastName: true }
      })
    ])

    const reviewStudentMap = new Map(reviewStudentUsers.map(u => [u.metaId, u]))
    const reviewTutorMap = new Map(reviewTutorUsers.map(u => [u.metaId, u]))

    const enrichedReviews = reviews.map(review => ({
      ...review,
      student: reviewStudentMap.get(review.studentId),
      tutor: reviewTutorMap.get(review.tutorId)
    }))

    return c.json({
      reviews: enrichedReviews,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

admin.delete('/reviews/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const reviewId = c.req.param('id')

    await db.review.delete({ where: { id: reviewId } })
    return c.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Delete review error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Session management endpoints
admin.get('/sessions', authMiddleware, requireAdmin, async (c) => {
  try {
    const query = c.req.query()
    const page = parseInt(query.page || '1')
    const limit = Math.min(parseInt(query.limit || '20'), 100)
    const skip = (page - 1) * limit
    const status = query.status

    const where: any = {}
    if (status) {
      where.status = status
    }

    const [sessions, totalCount] = await Promise.all([
      db.session.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          bookingId: true,
          actualStartTime: true,
          actualEndTime: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          booking: {
            select: {
              id: true,
              studentId: true,
              tutorId: true,
              scheduledStartTime: true,
              scheduledEndTime: true,
              status: true
            }
          }
        }
      }),
      db.session.count({ where })
    ])

    // Get user info for the sessions
    const sessionStudentIds = sessions.map(s => s.booking.studentId)
    const sessionTutorIds = sessions.map(s => s.booking.tutorId)
    
    const [sessionStudentUsers, sessionTutorUsers] = await Promise.all([
      db.user.findMany({
        where: { metaType: 'student', metaId: { in: sessionStudentIds } },
        select: { metaId: true, firstName: true, lastName: true }
      }),
      db.user.findMany({
        where: { metaType: 'tutor', metaId: { in: sessionTutorIds } },
        select: { metaId: true, firstName: true, lastName: true }
      })
    ])

    const sessionStudentMap = new Map(sessionStudentUsers.map(u => [u.metaId, u]))
    const sessionTutorMap = new Map(sessionTutorUsers.map(u => [u.metaId, u]))

    const enrichedSessions = sessions.map(session => ({
      ...session,
      booking: {
        ...session.booking,
        student: sessionStudentMap.get(session.booking.studentId),
        tutor: sessionTutorMap.get(session.booking.tutorId)
      }
    }))

    return c.json({
      sessions: enrichedSessions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// System settings endpoints
admin.get('/settings', authMiddleware, requireAdmin, async (c) => {
  // This could be used for platform settings, configurations, etc.
  return c.json({
    settings: {
      platform: {
        name: "Chattri Tutoring Platform",
        version: "1.0.0",
        maintenance: false
      },
      features: {
        registrationEnabled: true,
        reviewsEnabled: true,
        notificationsEnabled: true
      }
    }
  })
})

admin.put('/settings', authMiddleware, requireAdmin, async (c) => {
  try {
    const body = await c.req.json()
    
    // Here you would update system settings
    // For now, we'll just return success
    return c.json({ 
      message: 'Settings updated successfully',
      settings: body
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default admin
