import { api } from '../../api-client'

export const sessionsApi = {
  // Get active session for current user
  getActiveSession: async () => {
    const response = await api.get('/sessions/active')
    return response.data
  },

  // Get session by booking ID
  getSessionByBooking: async (bookingId: string) => {
    const response = await api.get(`/sessions/booking/${bookingId}`)
    return response.data
  },

  // Check session access
  checkSessionAccess: async (sessionId: string) => {
    const response = await api.get(`/sessions/${sessionId}/access`)
    return response.data
  },

  // Start/join session
  startSession: async (sessionId: string) => {
    const response = await api.patch(`/sessions/${sessionId}/start`)
    return response.data
  },

  // Complete session (tutors only)
  completeSession: async (sessionId: string, notes?: string) => {
    const response = await api.patch(`/sessions/${sessionId}/complete`, { notes })
    return response.data
  },

  // Send message
  sendMessage: async (sessionId: string, messageContent: string) => {
    const response = await api.post(`/sessions/${sessionId}/messages`, { messageContent })
    return response.data
  },

  // Get messages
  getMessages: async (sessionId: string) => {
    const response = await api.get(`/sessions/${sessionId}/messages`)
    return response.data
  },
}
