import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { authMiddleware } from '../middleware/auth.js'
import { updateProfileSchema, updateStudentSchema, updateTutorSchema } from '../lib/validation.js'

const users = new Hono()

//  current user profile
users.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    // Fetch fresh user data
    const userData = await db.user.findUnique({
      where: { id: user.userId }
    })

    if (!userData) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Fetch profile data based on user type
    let profileData = null
    if (userData.metaType === 'student') {
      profileData = await db.student.findUnique({
        where: { id: userData.metaId }
      })
    } else if (userData.metaType === 'tutor') {
      profileData = await db.tutor.findUnique({
        where: { id: userData.metaId },
        include: {
          timeSlots: true,
          reviews: {
            include: {
              student: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      })
    }

    return c.json({
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        role: userData.metaType,
        lastName: userData.lastName,
        metaType: userData.metaType,
        metaId: userData.metaId,
        phone: userData.phone,
        timeZone: userData.timeZone,
        avatarUrl: userData.avatarUrl,
        isVerified: userData.isVerified,
        createdAt: userData.createdAt,
        ...(userData.metaType === 'student' && { student: profileData }),
        ...(userData.metaType === 'tutor' && { tutor: profileData })
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Get user by ID
users.get('/:id', authMiddleware, async (c) => {
  const userId = c.req.param('id')
  const user = await db.user.findUnique({
    where: { id: userId }
  })
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  return c.json(user)
})

// Update user profile
users.patch('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json()
    const validatedData = updateProfileSchema.parse(body)

    // Update user data
    const updatePayload: any = {
      ...(validatedData.firstName && { firstName: validatedData.firstName }),
      ...(validatedData.lastName && { lastName: validatedData.lastName }),
      ...(validatedData.timeZone && { timeZone: validatedData.timeZone }),
      ...(validatedData.avatarUrl && { avatarUrl: validatedData.avatarUrl }),
      ...(validatedData.email && { email: validatedData.email }),
      ...(validatedData.phone && { phone: validatedData.phone }),
    }

    let updatedUser
    try {
      updatedUser = await db.user.update({
        where: { id: user.userId },
        data: updatePayload,
      })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return c.json({ error: 'Email already in use' }, 400)
      }
      throw err
    }

    return c.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        metaType: updatedUser.metaType,
        phone: updatedUser.phone,
        timeZone: updatedUser.timeZone,
        avatarUrl: updatedUser.avatarUrl,
      }
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Update profile error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
//TODO
// Update student profile
users.patch('/student/:id', authMiddleware, async (c) => {
  try {
    const studentId = c.req.param('id')
    const body = await c.req.json()
    const validatedData = updateStudentSchema.parse(body)

    const updatedStudent = await db.student.update({
      where: { id: studentId },
      data: {
        ...(validatedData.bio && { bio: validatedData.bio }),
        ...(validatedData.learningGoals && { learningGoals: validatedData.learningGoals }),
        ...(validatedData.preferredLanguages && { preferredLanguages: validatedData.preferredLanguages }),
        ...(validatedData.experienceLevel && { experienceLevel: validatedData.experienceLevel }),
      }
    })

    return c.json({
      message: 'Student profile updated successfully',
      student: updatedStudent
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Update student profile error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
//TODO
// Update tutor profile
users.patch('/tutor/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    
    if (user.role !== 'tutor') {
      return c.json({ error: 'Only tutors can update tutor profile' }, 403)
    }

    const body = await c.req.json()
    const validatedData = updateTutorSchema.parse(body)

    const updatedTutor = await db.tutor.update({
      where: { id: user.metaId },
      data: {
        ...(validatedData.bio && { bio: validatedData.bio }),
        ...(validatedData.expertise && { expertise: validatedData.expertise }),
        ...(validatedData.videoPlatformLink && { videoPlatformLink: validatedData.videoPlatformLink }),
        ...(validatedData.teachingLanguages && { teachingLanguages: validatedData.teachingLanguages }),
        ...(validatedData.yearsExperience !== undefined && { yearsExperience: validatedData.yearsExperience }),
        ...(validatedData.education && { education: validatedData.education }),
      }
    })

    return c.json({
      message: 'Tutor profile updated successfully',
      tutor: updatedTutor
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Update tutor profile error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default users