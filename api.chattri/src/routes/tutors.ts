import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { authMiddleware, requireRole, optionalAuthMiddleware, requireAdmin } from '../middleware/auth.js'
import { tutorSearchSchema, updateAvailabilitySchema, addUnavailableDateSchema, availabilityQuerySchema, createTutorSchema } from '../lib/validation.js'
import { updateTutorAvailability, getTutorAvailableSlots, createTutorTimeSlots } from '../utils/availability.js'
import { generateId, generateUserId, generateTutorId } from '../utils/id-generator.js'
import { Role, hashPassword, generateToken } from '../utils/auth.js'

const tutors = new Hono()

// Create tutor account (admin only)
tutors.post('/', authMiddleware, requireAdmin, async (c) => {
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
        metaId: tutorId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        timeZone: validatedData.timeZone,
      }
    })

    // Set up initial availability if provided
    if (validatedData.availableHours && validatedData.availableHours.length > 0) {
      await createTutorTimeSlots(tutorId, validatedData.availableHours)
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.metaType,
      metaId: tutorId
    })

    return c.json({
      message: 'Tutor account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.metaType,
        timeZone: user.timeZone,
      },
      tutor: {
        id: tutor.id,
        bio: tutor.bio,
        expertise: tutor.expertise,
        videoPlatformLink: tutor.videoPlatformLink,
        teachingLanguages: tutor.teachingLanguages,
        yearsExperience: tutor.yearsExperience,
        education: tutor.education,
      },
      token
    }, 201)

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Create tutor error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// List tutors with filtering and pagination
tutors.get('/', optionalAuthMiddleware, async (c) => {
  try {
    const query = c.req.query()
    const validatedQuery = tutorSearchSchema.parse({
      expertise: query.expertise,
      language: query.language,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    })

    const skip = (validatedQuery.page - 1) * validatedQuery.limit

    // Build where clause for filtering
    const where: any = {}
    
    if (validatedQuery.expertise) {
      where.expertise = {
        array_contains: [validatedQuery.expertise]
      }
    }
    
    if (validatedQuery.language) {
      where.teachingLanguages = {
        array_contains: [validatedQuery.language]
      }
    }

    // Get tutors with their user data and reviews
    const tutors = await db.tutor.findMany({
      where,
      skip,
      take: validatedQuery.limit,
      include: {
        reviews: {
          select: {
            rating: true,
            reviewText: true,
            createdAt: true,
            student: {
              select: {
                id: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    // Get user data for each tutor
    const tutorsWithUserData = await Promise.all(
      tutors.map(async (tutor) => {
        const user = await db.user.findFirst({
          where: { 
            metaType: 'tutor',
            metaId: tutor.id 
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            timeZone: true
          }
        })

        // Calculate average rating
        const averageRating = tutor.reviews.length > 0
          ? tutor.reviews.reduce((sum, review) => sum + review.rating, 0) / tutor.reviews.length
          : 0

        return {
          id: tutor.id,
          bio: tutor.bio,
          expertise: tutor.expertise,
          videoPlatformLink: tutor.videoPlatformLink,
          teachingLanguages: tutor.teachingLanguages,
          yearsExperience: tutor.yearsExperience,
          education: tutor.education,
          user: user,
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews: tutor.reviews.length,
          recentReviews: tutor.reviews.slice(0, 3)
        }
      })
    )

    // Get total count for pagination
    const totalCount = await db.tutor.count({ where })

    return c.json({
      tutors: tutorsWithUserData,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / validatedQuery.limit)
      }
    })

  } catch (error) {
    console.error('List tutors error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get specific tutor profile
tutors.get('/:id', optionalAuthMiddleware, async (c) => {
  try {
    const tutorId = c.req.param('id')

    const tutor = await db.tutor.findUnique({
      where: { id: tutorId },
      include: {
        reviews: {
          include: {
            student: {
              select: {
                id: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        timeSlots: {
          where: {
            isAvailable: true
          },
          orderBy: {
            hourStart: 'asc'
          }
        }
      }
    })

    if (!tutor) {
      return c.json({ error: 'Tutor not found' }, 404)
    }

    // Get user data
    const user = await db.user.findFirst({
      where: { 
        metaType: 'tutor',
        metaId: tutor.id 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        timeZone: true,
        createdAt: true
      }
    })

    // Calculate average rating
    const averageRating = tutor.reviews.length > 0
      ? tutor.reviews.reduce((sum, review) => sum + review.rating, 0) / tutor.reviews.length
      : 0

    return c.json({
      tutor: {
        id: tutor.id,
        bio: tutor.bio,
        expertise: tutor.expertise,
        videoPlatformLink: tutor.videoPlatformLink,
        teachingLanguages: tutor.teachingLanguages,
        yearsExperience: tutor.yearsExperience,
        education: tutor.education,
        user: user,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: tutor.reviews.length,
        reviews: tutor.reviews,
        availableTimeSlots: tutor.timeSlots.map(slot => slot.hourStart)
      }
    })

  } catch (error) {
    console.error('Get tutor error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Set tutor availability
tutors.post('/availability', authMiddleware, requireRole([Role.TUTOR]), async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const { availableHours } = body

    console.log('Setting availability for tutor:', user.metaId, 'Hours:', availableHours)

    if (!Array.isArray(availableHours) || !availableHours.every(h => Number.isInteger(h) && h >= 0 && h <= 23)) {
      return c.json({ error: 'availableHours must be an array of integers between 0 and 23' }, 400)
    }

    await updateTutorAvailability(user.metaId, availableHours)

    console.log('Successfully updated availability for tutor:', user.metaId)

    return c.json({
      message: 'Availability updated successfully',
      availableHours
    })

  } catch (error) {
    console.error('Update availability error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update specific time slot availability
tutors.patch('/availability/slot', authMiddleware, requireRole([Role.TUTOR]), async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = updateAvailabilitySchema.parse(body)

    await db.tutorTimeSlot.updateMany({
      where: {
        tutorId: user.metaId,
        hourStart: validatedData.hourStart
      },
      data: {
        isAvailable: validatedData.isAvailable
      }
    })

    return c.json({
      message: 'Time slot updated successfully',
      hourStart: validatedData.hourStart,
      isAvailable: validatedData.isAvailable
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Update time slot error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Add unavailable date
tutors.post('/unavailable-dates', authMiddleware, requireRole([Role.TUTOR]), async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = addUnavailableDateSchema.parse(body)

    const unavailableDate = await db.tutorUnavailableDate.create({
      data: {
        id: generateId(),
        tutorId: user.metaId,
        unavailableDate: new Date(validatedData.unavailableDate),
        reason: validatedData.reason
      }
    })

    return c.json({
      message: 'Unavailable date added successfully',
      unavailableDate
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Add unavailable date error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get tutor's available slots for a specific date
tutors.get('/:id/availability', async (c) => {
  try {
    const tutorId = c.req.param('id')
    const query = c.req.query()
    const validatedQuery = availabilityQuerySchema.parse({
      tutorId,
      date: query.date
    })

    // Get tutor's timezone
    const user = await db.user.findFirst({
      where: {
        metaType: 'tutor',
        metaId: tutorId
      },
      select: {
        timeZone: true
      }
    })

    if (!user) {
      return c.json({ error: 'Tutor not found' }, 404)
    }

    const availableSlots = await getTutorAvailableSlots(
      tutorId,
      new Date(validatedQuery.date),
      user.timeZone
    )

    return c.json({
      date: validatedQuery.date,
      tutorId,
      availableSlots: availableSlots.map(hour => `${hour.toString().padStart(2, '0')}:00`)
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Get availability error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get tutor's unavailable dates
tutors.get('/:id/unavailable-dates', optionalAuthMiddleware, async (c) => {
  try {
    const tutorId = c.req.param('id')

    const unavailableDates = await db.tutorUnavailableDate.findMany({
      where: {
        tutorId
      },
      select: {
        id: true,
        tutorId: true,
        unavailableDate: true,
        reason: true
      },
      orderBy: {
        unavailableDate: 'asc'
      }
    })

    return c.json({
      unavailableDates: unavailableDates.map(date => ({
        id: date.id,
        tutorId: date.tutorId,
        unavailableDate: date.unavailableDate.toISOString().split('T')[0],
        reason: date.reason
      }))
    })

  } catch (error) {
    console.error('Get unavailable dates error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default tutors