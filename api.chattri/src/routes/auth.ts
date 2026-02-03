import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { generateUserId, generateStudentId, generateTutorId } from '../utils/id-generator.js'
import { hashPassword, comparePassword, generateToken } from '../utils/auth.js'
import { registerSchema, loginSchema } from '../lib/validation.js'
import { createTutorTimeSlots, updateTutorAvailability } from '../utils/availability.js'

const auth = new Hono()

// Register endpoint
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = registerSchema.parse(body)

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
    const studentId = generateStudentId()
    
    // Create student profile
    const student = await db.student.create({
      data: {
        id: studentId,
        bio: validatedData.bio || null,
        learningGoals: validatedData.learningGoals || null,
        preferredLanguages: validatedData.preferredLanguages || undefined,
        experienceLevel: validatedData.experienceLevel || null,
      }
    })

    // Create user
    const user = await db.user.create({
      data: {
        id: userId,
        email: validatedData.email,
        passwordHash,
        metaType: 'student',
        metaId: student.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        timeZone: validatedData.timeZone,
      }
    })

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.metaType,
      metaId: student.id
    })

    return c.json({
      message: 'Student registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.metaType,
        timeZone: user.timeZone,
        student: student
      },
      token
    }, 201)

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Registration error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Login endpoint
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = loginSchema.parse(body)

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (!user || !user.isActive) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Check password
    const isValidPassword = await comparePassword(validatedData.password, user.passwordHash)
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.metaType,
      metaId: user.metaId
    })

    // Fetch related profile data
    let profileData = null
    if (user.metaType === 'student') {
      profileData = await db.student.findUnique({ where: { id: user.metaId } })
    } else if (user.metaType === 'tutor') {
      profileData = await db.tutor.findUnique({ where: { id: user.metaId } })
    }

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.metaType,
        timeZone: user.timeZone,
        ...(user.metaType === 'student' && { student: profileData }),
        ...(user.metaType === 'tutor' && { tutor: profileData })
      },
      token
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      return c.json({ error: 'Validation failed', details: error.message }, 400)
    }
    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Forgot password endpoint (mock for now)
auth.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json()
    const { email } = body

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email }
    })

    // Always return success to prevent email enumeration
    return c.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Reset password endpoint (mock for now)
auth.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json()
    const { token, newPassword } = body

    // Mock implementation - in real app, verify reset token
    return c.json({
      message: 'Password reset functionality coming soon'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default auth