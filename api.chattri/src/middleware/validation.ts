import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { z } from 'zod'

/**
 * Validation middleware factory
 * Validates request body, query params, or URL params against a Zod schema
 */
export function validate<T>(
  schema: z.ZodType<T>,
  target: 'json' | 'query' | 'param' = 'json'
) {
  return async (c: Context, next: Next) => {
    try {
      let data: unknown

      switch (target) {
        case 'json':
          data = await c.req.json()
          break
        case 'query':
          data = c.req.query()
          break
        case 'param':
          data = c.req.param()
          break
        default:
          throw new Error('Invalid validation target')
      }

      const result = schema.safeParse(data)

      if (!result.success) {
        const errors = result.error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))

        throw new HTTPException(400, {
          message: 'Validation failed',
          cause: { errors }
        })
      }

      // Store validated data in context
      c.set('validatedData', result.data)
      await next()
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error
      }

      if (error instanceof SyntaxError) {
        throw new HTTPException(400, { message: 'Invalid JSON format' })
      }

      throw new HTTPException(500, { message: 'Validation error occurred' })
    }
  }
}

/**
 * Get validated data from context
 */
export function getValidatedData<T>(c: Context): T {
  return c.get('validatedData') as T
}