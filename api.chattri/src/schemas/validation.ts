import { z } from 'zod'

// Common schemas
export const idSchema = z.string().length(6).regex(/^[A-Za-z0-9_-]+$/, 'Invalid ID format')

export const timeZoneSchema = z.string().min(1, 'Timezone is required')

export const emailSchema = z.string().email('Invalid email format')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  timeZone: timeZoneSchema,
  metaType: z.enum(['student', 'tutor']),
  // Profile data based on user type
  bio: z.string().optional(),
  learningGoals: z.string().optional(),
  preferredLanguages: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  expertise: z.array(z.string()).optional(),
  videoPlatformLink: z.string().url().optional(),
  teachingLanguages: z.array(z.string()).optional(),
  yearsExperience: z.number().int().min(0).optional(),
  education: z.string().optional(),
  availableHours: z.array(z.number().int().min(0).max(23)).optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
})

// User profile schemas
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  timeZone: timeZoneSchema.optional(),
  avatarUrl: z.string().url().optional(),
})

export const updateStudentProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  learningGoals: z.string().max(1000).optional(),
  preferredLanguages: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

export const updateTutorProfileSchema = z.object({
  bio: z.string().min(1).max(1000).optional(),
  expertise: z.array(z.string().min(1)).min(1, 'At least one expertise is required').optional(),
  videoPlatformLink: z.string().url().optional(),
  teachingLanguages: z.array(z.string().min(1)).min(1, 'At least one language is required').optional(),
  yearsExperience: z.number().int().min(0).optional(),
  education: z.string().max(500).optional(),
})

// Tutor availability schemas
export const updateAvailabilitySchema = z.object({
  availableHours: z.array(z.number().int().min(0).max(23))
    .min(1, 'At least one hour must be selected')
    .max(24, 'Cannot select more than 24 hours'),
})

export const addUnavailableDateSchema = z.object({
  date: z.string().datetime(),
  reason: z.string().max(200).optional(),
})

// Booking schemas
export const createBookingSchema = z.object({
  tutorId: idSchema,
  scheduledStartTime: z.string().datetime(),
})

export const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'cancelled']),
  reason: z.string().max(500).optional(),
})

// Review schemas
export const createReviewSchema = z.object({
  bookingId: idSchema,
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
  isPublic: z.boolean().default(true),
})

// Message schemas
export const sendMessageSchema = z.object({
  messageContent: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
})

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const tutorFilterSchema = z.object({
  expertise: z.string().optional(),
  language: z.string().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  ...paginationSchema.shape,
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: 'Start date must be before end date' }
)