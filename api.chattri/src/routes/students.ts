import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { authMiddleware, requireOwnerOrAdmin } from '../middleware/auth.js'
import { updateStudentSchema } from '../lib/validation.js'

const students = new Hono()

// Get student by ID
students.get('/:id', authMiddleware, requireOwnerOrAdmin((c) => {
  // Return the student record id (metaId). Middleware will compare this against the
  // JWT's metaId or userId to determine ownership.
  const studentId = c.req.param('id')
  return studentId
}), async (c) => {
  try {
    const studentId = c.req.param('id')

    const student = await db.student.findUnique({
      where: { id: studentId }
    })

    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }

    // Get user data
    const user = await db.user.findFirst({
      where: { 
        metaType: 'student',
        metaId: student.id 
      }
    })

    return c.json({
      id: student.id,
      bio: student.bio,
      learningGoals: student.learningGoals,
      preferredLanguages: student.preferredLanguages,
      experienceLevel: student.experienceLevel,
      user:user
    })

  } catch (error) {
    console.error('Get student error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update student profile
students.patch('/:id', authMiddleware, requireOwnerOrAdmin((c) => {
  // Return the student record id (metaId) for ownership checks
  const studentId = c.req.param('id')
  return studentId
}), async (c) => {
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
    console.error('Update student error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Delete student
students.delete('/:id', authMiddleware, requireOwnerOrAdmin((c) => {
  // Return the student record id (metaId) for ownership checks
  const studentId = c.req.param('id')
  return studentId
}), async (c) => {
  try {
    const studentId = c.req.param('id')

    // Find the user associated with this student
    const user = await db.user.findFirst({
      where: {
        metaType: 'student',
        metaId: studentId
      }
    })

    if (!user) {
      return c.json({ error: 'Student not found' }, 404)
    }

    // Delete student and user in transaction
    await db.$transaction([
      db.student.delete({ where: { id: studentId } }),
      db.user.delete({ where: { id: user.id } })
    ])

    return c.json({
      message: 'Student deleted successfully'
    })

  } catch (error) {
    console.error('Delete student error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export default students
