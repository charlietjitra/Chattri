import { api } from '../../api-client'
import type { User } from '@/types'

export const usersApi = {
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },
  // get current authenticated user (/users/me)
  getCurrentUser: async (): Promise<any> => {
    const response = await api.get(`/users/me`)
    return response.data
  },
  // update current authenticated user's profile (/users/me)
  updateMe: async (payload: Partial<User & { email?: string; phone?: string }>) => {
    const response = await api.patch(`/users/me`, payload)
    return response.data
  }
}
