import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { createBookingSchema, updateBookingStatusSchema } from '../lib/validation.js'
import { generateBookingId, generateSessionId } from '../utils/id-generator.js'
import { isTimeSlotAvailable } from '../utils/availability.js'
import { Role } from '../utils/auth.js'

const bookings = new Hono()

// Create a booking (student books a tutor)
bookings.post('/', authMiddleware, requireRole([Role.STUDENT]), async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = createBookingSchema.parse(body)
    
    // Verify the tutor exists
    const tutor = await db.tutor.findUnique({
      where: { id: validatedData.tutorId }
    })

    if (!tutor) {
      return c.json({ error: 'Tutor not found' }, 404)
    }

    // Get tutor's timezone for availability check
    const tutorUser = await db.user.findFirst({
      where: { metaType: 'tutor', metaId: validatedData.tutorId },
      select: { timeZone: true }
    })

    if (!tutorUser) {
      return c.json({ error: 'Tutor user not found' }, 404)
    }

    const scheduledStart = new Date(validatedData.scheduledStartTime)
    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000) // +1 hour

    // Check if the slot is available
    const slotAvailable = await isTimeSlotAvailable(
      validatedData.tutorId,
      scheduledStart
    )

    if (!slotAvailable) {
      return c.json({ error: 'Time slot is not available' }, 400)
    }

    // Create the booking
    const booking = await db.booking.create({
      data: {
        id: generateBookingId(),
        studentId: user.metaId,
        tutorId: validatedData.tutorId,
        scheduledStartTime: scheduledStart,
        scheduledEndTime: scheduledEnd,
        status: 'pending'
      }
    })

    return c.json(booking, 201)

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Create booking error:', error)
    return c.json({ error: 'Error creating bookings' }, 500)
  }
})

// Get all bookings for current user
bookings.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    // Get bookings with all related data in one query
    const bookings = await db.booking.findMany({
      where: user.role === 'student' 
        ? { studentId: user.metaId }
        : { tutorId: user.metaId },
      include: {
        tutor: {
          select: {
            bio: true,
            expertise: true,
            videoPlatformLink: true
          }
        },
        student: {
          select: {
            bio: true,
            learningGoals: true
          }
        },
        review: true,
      },
      orderBy: { scheduledStartTime: 'desc' }
    })

    // Get all user data in parallel
    const bookingsWithUserData = await Promise.all(
      bookings.map(async (booking) => {
        // Get both tutor and student user data
        const [tutorUser, studentUser] = await Promise.all([
          db.user.findFirst({
            where: { metaType: 'tutor', metaId: booking.tutorId },
            select: { firstName: true, lastName: true, avatarUrl: true, timeZone: true }
          }),
          db.user.findFirst({
            where: { metaType: 'student', metaId: booking.studentId },
            select: { firstName: true, lastName: true, avatarUrl: true, timeZone: true }
          })
        ])

        return {
          ...booking,
          tutor: booking.tutor ? { ...booking.tutor, user: tutorUser } : undefined,
          student: booking.student ? { ...booking.student, user: studentUser } : undefined
        }
      })
    )

    return c.json(bookingsWithUserData)

  } catch (error) {
    console.error('Get bookings error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Accept booking (tutor accepts)
bookings.patch('/:id/accept', authMiddleware, requireRole([Role.TUTOR]), async (c) => {
  try {
    const user = c.get('user')
    const bookingId = c.req.param('id')

    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404)
    }

    if (booking.tutorId !== user.metaId) {
      return c.json({ error: 'Not authorized to modify this booking' }, 403)
    }

    if (booking.status !== 'pending') {
      return c.json({ error: 'Booking is not in pending status' }, 400)
    }

    // Update booking status and create session
    const [updatedBooking, session] = await db.$transaction([
      db.booking.update({
        where: { id: bookingId },
        data: { status: 'confirmed' }
      }),
      db.session.create({
        data: {
          id: generateSessionId(),
          bookingId: bookingId,
          status: 'scheduled'
        }
      })
    ])

    return c.json({
      message: 'Booking accepted successfully',
      booking: updatedBooking,
      session
    })

  } catch (error) {
    console.error('Accept booking error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Reject booking (tutor rejects)
bookings.patch('/:id/reject', authMiddleware, requireRole([Role.TUTOR]), async (c) => {
  try {
    const user = c.get('user')
    const bookingId = c.req.param('id')
    const body = await c.req.json()
    const { cancellationReason } = body

    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404)
    }

    if (booking.tutorId !== user.metaId) {
      return c.json({ error: 'Not authorized to modify this booking' }, 403)
    }

    if (booking.status !== 'pending') {
      return c.json({ error: 'Booking is not in pending status' }, 400)
    }

    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: { 
        status: 'rejected',
        cancellationReason,
        cancelledBy: user.userId
      }
    })

    return c.json({
      message: 'Booking rejected successfully',
      booking: updatedBooking
    })

  } catch (error) {
    console.error('Reject booking error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Cancel booking (student or tutor cancels)
bookings.patch('/:id/cancel', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const bookingId = c.req.param('id')
    const body = await c.req.json()
    const { cancellationReason } = body

    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return c.json({ error: 'Booking not found' }, 404)
    }

    // Check if user is authorized to cancel
    const isAuthorized = (user.role === 'student' && booking.studentId === user.metaId) ||
                        (user.role === 'tutor' && booking.tutorId === user.metaId)

    if (!isAuthorized) {
      return c.json({ error: 'Not authorized to cancel this booking' }, 403)
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return c.json({ error: 'Booking cannot be cancelled in current status' }, 400)
    }

    const updatedBooking = await db.booking.update({
      where: { id: bookingId },
      data: { 
        status: 'cancelled',
        cancellationReason,
        cancelledBy: user.userId
      }
    })

    return c.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking
    })

  } catch (error) {
    console.error('Cancel booking error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default bookings