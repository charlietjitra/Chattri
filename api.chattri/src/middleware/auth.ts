import type { Context, Next, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { verifyToken, extractTokenFromHeader, type JWTPayload, Role } from '../utils/auth.js'

// Extend the Hono context to include user information
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and sets user context
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      throw new HTTPException(401, { message: 'Authorization token required' })
    }

    const payload = verifyToken(token)
    c.set('user', payload)

    await next()
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }
}

/**
 * Role-based authorization middleware
 * Restricts access to specific user types
 */
export function requireRole(allowedRoles: Role[]): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    if (!allowedRoles.includes(user.role as Role)) {
      throw new HTTPException(403, { 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      })
    }

    await next()
  }
}

/**
 * Admin-only authorization middleware
 * Only allows admin users
 */
export const requireAdmin: MiddlewareHandler = async (c: Context, next: Next) => {
  const user = c.get('user')
  
  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  if (user.role !== Role.ADMIN) {
    throw new HTTPException(403, { message: 'Admin access required' })
  }

  await next()
}

/**
 * Owner or Admin authorization middleware
 * Allows user to access their own resources or admin to access any
 */
export function requireOwnerOrAdmin(getResourceUserId: (c: Context) => string): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const user = c.get('user')
    
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    const resourceUserId = getResourceUserId(c)

    // Canonical ownership check: compare resource record id (metaId) against
    // the JWT's metaId. Admins are still allowed. This keeps the check
    // synchronous and avoids DB lookups inside middleware.
    const tokenMetaId = (user as any).metaId

    const isOwnerByMetaId = tokenMetaId && tokenMetaId === resourceUserId

    if (user.role !== Role.ADMIN && !isOwnerByMetaId) {
      // Dev-only debug logging to help trace mismatches during rollout
      if (process.env.NODE_ENV !== 'production') {
        try {
          console.debug('[auth] requireOwnerOrAdmin denied access (metaId mismatch):', {
            resourceUserId,
            tokenMetaId,
            tokenUserId: (user as any).userId,
            tokenRole: (user as any).role
          })
        } catch (e) {
          // ignore logging errors
        }
      }

      throw new HTTPException(403, { message: 'Access denied' })
    }

    await next()
  }
}

/**
 * Optional authentication middleware
 * Sets user context if token is provided, but doesn't require it
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization')
    const token = extractTokenFromHeader(authHeader)

    if (token) {
      const payload = verifyToken(token)
      c.set('user', payload)
    }

    await next()
  } catch (error) {
    // Ignore token errors for optional auth
    await next()
  }
}