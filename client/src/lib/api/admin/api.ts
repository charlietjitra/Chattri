import { api } from "../../api-client";

export const adminApi = {
  // Dashboard stats
  getStats: async () => {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  // User management
  getUsers: async (page = 1, limit = 20, role?: string) => {
    const response = await api.get("/admin/users", {
      params: { page, limit, role },
    });
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    await api.delete(`/admin/users/${id}`);
  },

  // Tutor management
  createTutor: async (data: any) => {
    const response = await api.post("/tutors", data);
    return response.data;
  },

  getTutors: async (page = 1, limit = 20) => {
    const response = await api.get("/tutors", {
      params: { page, limit },
    });
    return response.data;
  },

  deleteTutor: async (id: string) => {
    await api.delete(`/admin/tutors/${id}`);
  },

  // Booking management
  getBookings: async (page = 1, limit = 20, status?: string) => {
    const response = await api.get("/admin/bookings", {
      params: { page, limit, status },
    });
    return response.data;
  },

  updateBooking: async (id: string, data: any) => {
    const response = await api.put(`/admin/bookings/${id}`, data);
    return response.data;
  },

  deleteBooking: async (id: string) => {
    await api.delete(`/admin/bookings/${id}`);
  },

  // Review management
  getReviews: async (page = 1, limit = 20) => {
    const response = await api.get("/admin/reviews", {
      params: { page, limit },
    });
    return response.data;
  },

  deleteReview: async (id: string) => {
    await api.delete(`/admin/reviews/${id}`);
  },

  // Session management
  getSessions: async (page = 1, limit = 20, status?: string) => {
    const response = await api.get("/admin/sessions", {
      params: { page, limit, status },
    });
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await api.get("/admin/settings");
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await api.put("/admin/settings", data);
    return response.data;
  },
};
