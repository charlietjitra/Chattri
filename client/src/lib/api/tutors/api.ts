import { api } from "../../api-client";
import type { Tutor, TutorSearchParams } from "@/types";

interface UnavailableDate {
  id: string;
  tutorId: string;
  unavailableDate: string;
  reason?: string;
}

interface TimeSlot {
  hourStart: number;
  isAvailable: boolean;
}

interface UpdateTutorPayload {
  bio?: string;
  expertise?: string[];
  videoPlatformLink?: string;
  teachingLanguages?: string[];
  yearsExperience?: number;
  education?: string;
}

export const tutorsApi = {
  list: async (
    params?: TutorSearchParams
  ): Promise<{
    tutors: Tutor[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get("/tutors", { params });
    return response.data;
  },

  getById: async (id: string): Promise<Tutor> => {
    const response = await api.get(`/tutors/${id}`);
    return response.data.tutor;
  },

  getAvailability: async (tutorId: string, date: string): Promise<string[]> => {
    const response = await api.get(`/tutors/${tutorId}/availability`, {
      params: { date },
    });
    return response.data.availableSlots;
  },

  // Update tutor profile (requires tutor ID)
  updateTutor: async (
    tutorId: string,
    payload: UpdateTutorPayload
  ): Promise<{ message: string; tutor: any }> => {
    const response = await api.patch(`/users/tutor/${tutorId}`, payload);
    return response.data;
  },

  // Availability management
  setAvailableHours: async (
    availableHours: number[]
  ): Promise<{ message: string; availableHours: number[] }> => {
    const response = await api.post("/tutors/availability", { availableHours });
    return response.data;
  },

  updateTimeSlot: async (
    hourStart: number,
    isAvailable: boolean
  ): Promise<{ message: string; hourStart: number; isAvailable: boolean }> => {
    const response = await api.patch("/tutors/availability/slot", {
      hourStart,
      isAvailable,
    });
    return response.data;
  },

  addUnavailableDate: async (
    unavailableDate: string,
    reason?: string
  ): Promise<{ message: string; unavailableDate: UnavailableDate }> => {
    const response = await api.post("/tutors/unavailable-dates", {
      unavailableDate,
      reason,
    });
    return response.data;
  },

  getUnavailableDates: async (tutorId: string): Promise<UnavailableDate[]> => {
    const response = await api.get(`/tutors/${tutorId}/unavailable-dates`);
    return response.data.unavailableDates || [];
  },
};
