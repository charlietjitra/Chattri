import { nanoid } from 'nanoid'

/**
 * Generate a 6-character ID using nanoid
 * Uses URL-safe characters: A-Za-z0-9_-
 */
export function generateId(): string {
  return nanoid(6)
}

/**
 * Generate user-specific IDs with prefixes for easy identification
 */
export function generateUserId(): string {
  return `u${nanoid(5)}` // u + 5 chars = 6 total
}

export function generateStudentId(): string {
  return `s${nanoid(5)}` // s + 5 chars = 6 total
}

export function generateTutorId(): string {
  return `t${nanoid(5)}` // t + 5 chars = 6 total
}

export function generateBookingId(): string {
  return `b${nanoid(5)}` // b + 5 chars = 6 total
}

export function generateSessionId(): string {
  return `x${nanoid(5)}` // x + 5 chars = 6 total (session)
}

export function generateReviewId(): string {
  return `r${nanoid(5)}` // r + 5 chars = 6 total (review)
}

export function generateMessageId(): string {
  return `m${nanoid(5)}` // m + 5 chars = 6 total (message)
}

/**
 * Validate if a string is a valid 6-character ID
 */
export function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length === 6 && /^[A-Za-z0-9_-]+$/.test(id)
}

/**
 * Extract entity type from prefixed ID
 */
export function getEntityType(id: string): string | null {
  if (!isValidId(id)) return null
  
  const prefix = id[0]
  switch (prefix) {
    case 'u': return 'user'
    case 's': return 'student'
    case 't': return 'tutor'
    case 'b': return 'booking'
    case 'x': return 'session'
    default: return 'unknown'
  }
}