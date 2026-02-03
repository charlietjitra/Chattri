import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// Import routes
import auth from './routes/auth.js'
import users from './routes/users.js'
import students from './routes/students.js'
import tutors from './routes/tutors.js'
import admin from './routes/admin.js'
import bookings from './routes/bookings.js'
import reviews from './routes/reviews.js'
import sessions from './routes/sessions.js'

const app = new Hono()

// Middleware
app.use('*', logger())

// Better CORS configuration (like Express version)
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(' ') || []

app.use('*', cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return origin
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return origin
    }
    
    // For development, allow localhost on any port
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return origin
    }
    
    return null // Reject
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true, // If you need cookies/auth
}))

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'Chattri API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/auth/*',
      users: '/users/*',
      students: '/students/*',
      tutors: '/tutors/*',
      admin: '/admin/*',
      bookings: '/bookings/*',
      reviews: '/reviews/*',
      sessions: '/sessions/*'
    }
  })
})

// Routes
app.route('/auth', auth)
app.route('/users', users)
app.route('/students', students)
app.route('/tutors', tutors)
app.route('/admin', admin)
app.route('/bookings', bookings)
app.route('/reviews', reviews)
app.route('/sessions', sessions)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message 
  }, 500)
})

const port = process.env.PORT ? parseInt(process.env.PORT) : 8888

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`Chattri API running on http://localhost:${info.port}`)
  console.log(`WebSocket server running on ws://localhost:8889/ws`)
})