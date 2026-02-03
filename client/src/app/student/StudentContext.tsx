'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { studentsApi, usersApi } from '@/lib/api'
import type { Student } from '@/types'

export interface StudentUser {
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

interface StudentContextType {
  student?: Student
  refreshStudent: () => Promise<void>
}

const StudentContext = createContext<StudentContextType | undefined>(undefined)

export function StudentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [student, setStudent] = useState<Student>()

  const refreshStudent = async () => {
    if (!user || user.role !== 'student') return

    try {
      const meResponse = await usersApi.getCurrentUser()
      const meUser = meResponse.user || meResponse
      console.log('refreshStudent: fetched /users/me', meUser)

      const metaId = meUser.metaId || meUser.user?.metaId
      if (!metaId) {
        console.warn('refreshStudent: no metaId found for user', meUser)
        return
      }

      const studentData = await studentsApi.getStudentById(metaId)
      setStudent(studentData)
    } catch (err) {
      console.error('Failed to fetch student info', err)
    }
  }

  useEffect(() => {
    refreshStudent()
  }, [user])

  return (
    <StudentContext.Provider value={{ student, refreshStudent }}>
      {children}
    </StudentContext.Provider>
  )
}

export function useStudent() {
  const context = useContext(StudentContext)
  if (!context) throw new Error('useStudent must be used within a StudentProvider')
  return context
}
