'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, usersApi } from '@/lib/api'
import { setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api-client'
import type { LoginRequest, RegisterRequest, Role, AuthResponse } from '@/types'

interface AuthContextType {
  user: any | null
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const isBrowser = typeof window !== 'undefined'

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const token = getAuthToken()
      let storedUser: string | null = null
      if (isBrowser) {
        try {
          storedUser = localStorage.getItem('user')
        } catch (err) {
          console.warn('AuthContext: could not read stored user from localStorage', err)
        }
      }

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (error) {
          console.error('Failed to parse stored user:', error)
          removeAuthToken()
        }
      }
      setIsLoading(false)
    }

    loadUser()
    
  }, [isBrowser])

  // Listen for token expiration events
  useEffect(() => {
    const handleTokenExpired = () => {
      console.log('Token expired - logging out user')
      // Show an alert to the user
      if (isBrowser) {
        // Show a simple alert first so user knows what's happening
        setTimeout(() => {
          alert('Your session has expired. Please log in again.')
        }, 100)
      }
      logout()
    }

      if (isBrowser) {
        window.addEventListener('token-expired', handleTokenExpired)
      }

      return () => {
        if (isBrowser) {
          window.removeEventListener('token-expired', handleTokenExpired)
        }
      }
  }, [isBrowser])

  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data)
      
      // Store token and user
      setAuthToken(response.token)
      const userData = response.user
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      // Redirect based on role
      if (userData.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (userData.role === 'tutor') {
        router.push('/tutor/dashboard')
      } else {
        router.push('/student/tutors')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authApi.register(data)
      
      // Store token and user
      setAuthToken(response.token)
      const userData = response.user
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      // Redirect to tutors page after registration
      router.push('/student/tutors')
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  }

  const logout = () => {
    removeAuthToken()
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    try {
      const response = await usersApi.getCurrentUser()
      const userData = response?.user ?? response
      if (!userData) {
        console.warn('refreshUser: unexpected response from /users/me', response)
        return
      }
      // persist and set only when we have a valid user object
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user', error)
    }
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    // Only derive authentication from the loaded `user` object.
    // Avoid reading `localStorage` synchronously during render because
    // that causes the client to render different HTML than the server
    // (hydration mismatch). We refresh the user on mount if a token
    // exists so the client will update after hydration.
    isAuthenticated: !!user,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
