'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { tutorsApi, usersApi } from '@/lib/api'
import type { Tutor } from '@/types'

export interface TutorUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  timeZone: string
  createdAt: string
}

export interface Review {
  id: string
  rating: number
  comment?: string
  studentId: string
  createdAt: string
}

interface TutorContextType {
  tutor?: Tutor
  refreshTutor: () => Promise<void>
}

const TutorContext = createContext<TutorContextType | undefined>(undefined)

export function TutorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tutor, setTutor] = useState<Tutor>()

  const refreshTutor = async () => {
    if (!user || user.role !== 'tutor') return

    try {
      const userData = await usersApi.getUserById(user.id)
      const tutorData = await tutorsApi.getById(userData.metaId)
      setTutor(tutorData)
    } catch (err) {
      console.error('Failed to fetch tutor info', err)
    }
  }

  useEffect(() => {
    refreshTutor()
  }, [user])

  return (
    <TutorContext.Provider value={{ tutor, refreshTutor }}>
      {children}
    </TutorContext.Provider>
  )
}

export function useTutor() {
  const context = useContext(TutorContext)
  if (!context) throw new Error('useTutor must be used within a TutorProvider')
  return context
}
