import { api } from '../../api-client'
import type { Booking, BookingCreateRequest } from '@/types'

export const bookingsApi = {
  create: async (data: BookingCreateRequest): Promise<Booking> => {
    const response = await api.post('/bookings', data)
    return response.data
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings')
    return response.data
  },

  cancel: async (id: string, reason?: string): Promise<void> => {
    await api.patch(`/bookings/${id}/cancel`, { cancellationReason: reason })
  },

  accept: async (id: string): Promise<void> => {
    await api.patch(`/bookings/${id}/accept`)
  },

  reject: async (id: string, reason?: string): Promise<void> => {
    await api.patch(`/bookings/${id}/reject`, { cancellationReason: reason })
  },
}
