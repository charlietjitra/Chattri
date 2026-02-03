// API Types matching backend

export type Role = 'student' | 'tutor' | 'admin'

export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'

export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'no_show'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export interface User {
  id: string
  metaId: string
  email: string
  firstName: string
  lastName: string
  timeZone: string
  avatarUrl: string | null
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: string
  bio: string | null
  learningGoals: string | null
  preferredLanguages: string[] | null
  experienceLevel: ExperienceLevel | null
  createdAt: string
  updatedAt: string
}

export interface Tutor {
  id: string
  bio: string
  expertise: string[]
  videoPlatformLink: string
  teachingLanguages: string[]
  yearsExperience: number | null
  education: string | null
  createdAt: string
  updatedAt: string
  // Computed fields
  averageRating?: number
  totalReviews?: number
}

export interface Booking {
  id: string
  studentId: string
  tutorId: string
  scheduledStartTime: string
  scheduledEndTime: string
  status: BookingStatus
  cancellationReason: string | null
  cancelledBy: string | null
  createdAt: string
  updatedAt: string
  // Relations
  student?: Student
  tutor?: Tutor
  session?: Session
  review?: Review
}

export interface Session {
  id: string
  bookingId: string
  actualStartTime: string | null
  actualEndTime: string | null
  status: SessionStatus
  tutorNotes: string | null
  createdAt: string
  updatedAt: string
  // Relations
  booking?: Booking
  messages?: SessionMessage[]
}

export interface SessionMessage {
  id: string
  sessionId: string
  senderId: string
  messageContent: string
  sentAt: string
  expiresAt: string
}

export interface Review {
  id: string
  bookingId: string
  studentId: string
  tutorId: string
  rating: number
  comment: string | null
  createdAt: string
  // Relations
  student?: Student
  tutor?: Tutor
}

export interface TutorTimeSlot {
  id: string
  tutorId: string
  hourStart: number
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  timeZone: string
  bio?: string
  learningGoals?: string
  preferredLanguages?: string[]
  experienceLevel?: ExperienceLevel
}

export interface AuthResponse {
  message: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: Role
    timeZone: string
    student?: Student
    tutor?: Tutor
  }
  token: string
}

// API Response Types
export interface ApiError {
  error: string
  details?: any
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Search/Filter Types
export interface TutorSearchParams {
  search?: string
  language?: string
  expertise?: string
  minRating?: number
  page?: number
  limit?: number
}

export interface BookingCreateRequest {
  tutorId: string
  scheduledStartTime: string
}
