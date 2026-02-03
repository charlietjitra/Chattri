import { api } from '../../api-client'
import type { Student, User } from '@/types'

export const studentsApi = {
  getStudentById: async (id: string): Promise<Student> => {
    const response = await api.get(`/students/${id}`)
    return response.data
  },

  updateStudentById: async (id: string, data: any): Promise<User> => {
    const response = await api.patch(`/students/${id}`, data)
    return response.data
  },

  deleteStudentById: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`)
  }
}
