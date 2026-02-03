import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const isBrowser = typeof window !== 'undefined'

// Only register interceptors in the browser (avoid SSR ReferenceError)
if (isBrowser) {
  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (err) {
        // localStorage might be unavailable in some environments; ignore
        console.warn('api-client: could not read auth token from localStorage', err)
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      try {
        if (error.response?.status === 401) {
          // Token expired or invalid - dispatch event and show user message
          console.warn('Unauthorized (401): Token may have expired')
          const event = new CustomEvent('token-expired')
          window.dispatchEvent(event)
        }
      } catch (err) {
        // ignore
      }
      return Promise.reject(error)
    }
  )
}

// Auth token management (safe on server)
export const setAuthToken = (token: string) => {
  if (!isBrowser) return
  try {
    localStorage.setItem('auth_token', token)
  } catch (err) {
    console.warn('setAuthToken failed', err)
  }
}

export const getAuthToken = () => {
  if (!isBrowser) return null
  try {
    return localStorage.getItem('auth_token')
  } catch (err) {
    console.warn('getAuthToken failed', err)
    return null
  }
}

export const removeAuthToken = () => {
  if (!isBrowser) return
  try {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  } catch (err) {
    console.warn('removeAuthToken failed', err)
  }
}
