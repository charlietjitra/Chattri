import { db } from "../lib/db.js";
import { generateId } from "./id-generator.js";

/**
 * Create 24 time slots (00:00-23:00) for a new tutor
 * All slots are initially set to unavailable (false)
 */
export async function createTutorTimeSlots(tutorId: string): Promise<void> {
  const timeSlots = [];

  // Generate 24 hour slots (0-23)
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push({
      id: generateId(),
      tutorId,
      hourStart: hour,
      isAvailable: false, // Initially all slots are unavailable
    });
  }

  await db.tutorTimeSlot.createMany({
    data: timeSlots,
  });
}

/**
 * Update tutor's available time slots
 * @param tutorId - The tutor's ID
 * @param availableHours - Array of hours (0-23) that the tutor is available
 */
export async function updateTutorAvailability(
  tutorId: string,
  availableHours: number[]
): Promise<void> {
  console.log("updateTutorAvailability called with:", {
    tutorId,
    availableHours,
  });

  try {
    for (let hour = 0; hour < 24; hour++) {
      await db.tutorTimeSlot.upsert({
        where: {
          tutorId_hourStart: {
            tutorId,
            hourStart: hour,
          },
        },
        update: {
          isAvailable: availableHours.includes(hour),
        },
        create: {
          id: generateId(),
          tutorId,
          hourStart: hour,
          isAvailable: availableHours.includes(hour),
        },
      });
    }

    console.log("Successfully updated availability for tutor:", tutorId);
  } catch (error) {
    console.error("Error updating tutor availability:", error);
    throw error;
  }
}

/**
 * Get available time slots for a tutor on a specific date
 * Considers both time slot availability and unavailable dates
 */
export async function getTutorAvailableSlots(
  tutorId: string,
  date: Date,
  tutorTimeZone: string
): Promise<number[]> {
  // Normalize date to just the date part (no time) for comparison
  const normalizedDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  // Check if the date is marked as unavailable
  const unavailableDates = await db.tutorUnavailableDate.findMany({
    where: {
      tutorId,
    },
  });

  // Check if today matches any unavailable date
  const isUnavailable = unavailableDates.some((ud) => {
    const unavailableDateNormalized = new Date(
      ud.unavailableDate.getFullYear(),
      ud.unavailableDate.getMonth(),
      ud.unavailableDate.getDate()
    );
    return normalizedDate.getTime() === unavailableDateNormalized.getTime();
  });

  if (isUnavailable) {
    return []; // No slots available on this date
  }

  // Get available time slots
  const availableSlots = await db.tutorTimeSlot.findMany({
    where: {
      tutorId,
      isAvailable: true,
    },
    select: {
      hourStart: true,
    },
  });

  // Get existing bookings for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await db.booking.findMany({
    where: {
      tutorId,
      scheduledStartTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: {
        in: ["pending", "confirmed"],
      },
    },
    select: {
      scheduledStartTime: true,
    },
  });

  // Extract booked hours
  const bookedHours = existingBookings.map((booking) =>
    booking.scheduledStartTime.getHours()
  );

  // Filter out booked hours
  const availableHours = availableSlots
    .map((slot) => slot.hourStart)
    .filter((hour) => !bookedHours.includes(hour));

  return availableHours.sort();
}

/**
 * Check if a specific time slot is available for booking
 */
export async function isTimeSlotAvailable(
  tutorId: string,
  startTime: Date
): Promise<boolean> {
  const hour = startTime.getHours();
  const date = new Date(
    startTime.getFullYear(),
    startTime.getMonth(),
    startTime.getDate()
  );

  // Check if tutor has this hour slot available
  const timeSlot = await db.tutorTimeSlot.findFirst({
    where: {
      tutorId,
      hourStart: hour,
      isAvailable: true,
    },
  });

  if (!timeSlot) return false;

  // Check if date is marked as unavailable (normalize date comparison)
  const unavailableDates = await db.tutorUnavailableDate.findMany({
    where: {
      tutorId,
    },
  });

  const isUnavailable = unavailableDates.some((ud) => {
    const unavailableDateNormalized = new Date(
      ud.unavailableDate.getFullYear(),
      ud.unavailableDate.getMonth(),
      ud.unavailableDate.getDate()
    );
    return date.getTime() === unavailableDateNormalized.getTime();
  });

  if (isUnavailable) return false;

  // Check for existing bookings at this time
  const existingBooking = await db.booking.findFirst({
    where: {
      tutorId,
      scheduledStartTime: startTime,
      status: {
        in: ["pending", "confirmed"],
      },
    },
  });

  return !existingBooking;
}
