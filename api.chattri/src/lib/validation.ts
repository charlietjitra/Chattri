import { z } from 'zod'

// Auth schemas
// Student registration schema (public endpoint)
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  timeZone: z.string().min(1, 'Time zone is required'),
  
  // Student-specific fields (optional)
  bio: z.string().optional(),
  learningGoals: z.string().optional(),
  preferredLanguages: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

// Admin creates tutor schema
export const createTutorSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  timeZone: z.string().min(1, 'Time zone is required'),
  
  // Tutor-specific fields (required)
  bio: z.string().min(1, 'Bio is required'),
  expertise: z.array(z.string()).min(1, 'At least one expertise is required'),
  videoPlatformLink: z.string().url('Invalid video platform URL'),
  teachingLanguages: z.array(z.string()).min(1, 'At least one teaching language is required'),
  yearsExperience: z.number().int().min(0).optional(),
  education: z.string().optional(),
  availableHours: z.array(z.number().int().min(0).max(23)).optional(), // Array of hours 0-23
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// User update schemas
export const updateProfileSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  timeZone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
})

export const updateStudentSchema = z.object({
  bio: z.string().optional(),
  learningGoals: z.string().optional(),
  preferredLanguages: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

export const updateTutorSchema = z.object({
  bio: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  videoPlatformLink: z.string().url().optional(),
  teachingLanguages: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).optional(),
  education: z.string().optional(),
})

// Booking schemas
export const createBookingSchema = z.object({
  tutorId: z.string().min(1, 'Tutor ID is required'),
  scheduledStartTime: z.string().datetime({ offset: true }),
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'cancelled']),
  cancellationReason: z.string().optional(),
})

// Review schemas
export const createReviewSchema = z.object({
  tutorId: z.string().min(1, 'Tutor ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  reviewText: z.string().optional(),
  isPublic: z.boolean().default(true),
})

// Message schemas
export const sendMessageSchema = z.object({
  messageContent: z.string().min(1, 'Message content is required').max(1000, 'Message too long'),
})

// Tutor availability schemas
export const updateAvailabilitySchema = z.object({
  hourStart: z.number().int().min(0).max(23, 'Hour must be between 0 and 23'),
  isAvailable: z.boolean(),
})

export const addUnavailableDateSchema = z.object({
  unavailableDate: z.string().date('Invalid date format'),
  reason: z.string().optional(),
})

// Query schemas
export const tutorSearchSchema = z.object({
  expertise: z.string().optional(),
  language: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
})

export const availabilityQuerySchema = z.object({
  tutorId: z.string().min(1, 'Tutor ID is required'),
  date: z.string().date('Invalid date format'),
})