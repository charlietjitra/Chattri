"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addDays, startOfDay, parseISO, formatISO } from "date-fns";
import { convertToUTC } from "@/lib/timezone";
import { tutorsApi, bookingsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import type { Tutor } from "@/types";

interface TutorWithUser extends Tutor {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    timeZone: string;
  };
  averageRating?: number;
  totalReviews?: number;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const tutorId = params.id as string;

  const [tutor, setTutor] = useState<TutorWithUser | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Generate next 7 days for selection
  const availableDates = Array.from({ length: 7 }, (_, i) =>
    addDays(new Date(), i)
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "student") {
      router.push("/tutors");
      return;
    }

    fetchTutorData();
  }, [tutorId, isAuthenticated, user]);

  useEffect(() => {
    if (tutor) {
      fetchAvailableSlots();
    }
  }, [selectedDate, tutor]);

  const fetchTutorData = async () => {
    try {
      setIsLoading(true);
      const tutorData = await tutorsApi.getById(tutorId);
      setTutor(tutorData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load tutor");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const slots = await tutorsApi.getAvailability(tutorId, dateString);
      setAvailableSlots(slots);
      console.log("Fetched slots:", slots);
      setSelectedSlot(""); // Reset selection when date changes
    } catch (err: any) {
      console.error("Failed to fetch availability:", err);
      setAvailableSlots([]);
    }
  };

  const handleBookSession = async () => {
    if (!selectedSlot || !tutor || !user?.timeZone) return;

    try {
      setIsBooking(true);
      setError(null);

      // Parse the selected slot time and create start/end times in user's local timezone
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      // Convert from student's timezone to UTC
      const utcStartTime = convertToUTC(startTime, user.timeZone);

      const bookingData = {
        tutorId,
        scheduledStartTime: formatISO(utcStartTime),
      };

      await bookingsApi.create(bookingData);
      setBookingSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to book session");
    } finally {
      setIsBooking(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  if (!isAuthenticated || user?.role !== "student") {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#C17F59]" />
        </div>
      </div>
    );
  }

  if (error && !tutor) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline" className="border-[#C17F59]/20 text-[#C17F59]">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
        <div className="relative container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md border-0 bg-white/60 backdrop-blur-sm organic-shadow">
            <CardHeader className="text-center bg-gradient-to-br from-[#7D9D6A]/10 to-[#C17F59]/10 pb-4">
              <CheckCircle className="h-16 w-16 text-[#7D9D6A] mx-auto mb-4" />
              <CardTitle className="text-2xl text-[#5C5C5C]">Booking Confirmed!</CardTitle>
              <CardDescription className="text-[#5C5C5C]/70">
                Your session with {tutor?.user?.firstName} has been booked successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-[#5C5C5C]/70">Date:</span>
                  <span className="font-medium text-[#5C5C5C]">{format(selectedDate, "MMMM dd, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C5C5C]/70">Time:</span>
                  <span className="font-medium text-[#5C5C5C]">{selectedSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C5C5C]/70">Duration:</span>
                  <span className="font-medium text-[#5C5C5C]">1 hour</span>
                </div>
              </div>
              <div className="space-y-2">
                <Button onClick={() => router.push("/student/bookings")} className="w-full bg-[#C17F59] hover:bg-[#B3714F] hover-lift">
                  View My Bookings
                </Button>
                <Button onClick={() => router.push("/student/tutors")} variant="outline" className="w-full border-[#7D9D6A]/20 text-[#7D9D6A] hover:bg-[#7D9D6A]/5">
                  Back to Tutors
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      <div className="relative container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-[#C17F59] hover:bg-[#C17F59]/5">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
              <CardHeader className="bg-gradient-to-br from-[#C17F59]/5 to-[#7D9D6A]/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-[#5C5C5C]">
                  <Calendar className="h-5 w-5 text-[#C17F59]" />
                  Book a Session
                </CardTitle>
                <CardDescription className="text-[#5C5C5C]/70">
                  Select a date and time for your session with {tutor?.user?.firstName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-[#5C5C5C] mb-3">Select Date</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {availableDates.map((date) => (
                      <Button
                        key={date.toISOString()}
                        variant={selectedDate.toDateString() === date.toDateString() ? "default" : "outline"}
                        className={`p-3 h-auto flex-col transition-all duration-200 ${
                          selectedDate.toDateString() === date.toDateString()
                            ? "bg-[#C17F59] hover:bg-[#B3714F] hover-lift"
                            : "border-[#C17F59]/20 text-[#5C5C5C] hover:bg-[#C17F59]/5"
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="text-xs opacity-75">{format(date, "EEE")}</div>
                        <div className="text-sm font-semibold">{format(date, "MMM dd")}</div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Slot Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-[#5C5C5C] mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#7D9D6A]" />
                    Available Times for {format(selectedDate, "MMMM dd, yyyy")}
                  </h3>

                  {availableSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8 text-[#C17F59]/50" />
                      </div>
                      <p className="text-[#5C5C5C]/70">No available slots for this date</p>
                      <p className="text-sm text-[#5C5C5C]/50">Please select another date</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          className={
                            selectedSlot === slot
                              ? "bg-[#C17F59] hover:bg-[#B3714F] hover-lift"
                              : "border-[#C17F59]/20 text-[#5C5C5C] hover:bg-[#C17F59]/5"
                          }
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">{error}</div>
                )}

                {/* Book Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleBookSession}
                    disabled={!selectedSlot || isBooking}
                    className="w-full bg-[#C17F59] hover:bg-[#B3714F] hover-lift text-lg py-6 rounded-xl"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Booking Session...
                      </>
                    ) : (
                      "Book Session"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tutor Summary */}
          <div className="lg:col-span-1">
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow sticky top-4">
              <CardHeader className="bg-gradient-to-br from-[#C17F59]/5 to-[#7D9D6A]/5 pb-4">
                <CardTitle className="text-[#5C5C5C]">Session Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {tutor && (
                  <div className="space-y-4">
                    {/* Tutor Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={tutor.user?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] text-white">
                          {getInitials(tutor.user?.firstName, tutor.user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-[#5C5C5C]">{tutor.user?.firstName} {tutor.user?.lastName}</h4>
                        <p className="text-sm text-[#5C5C5C]/70">{tutor.yearsExperience} years experience</p>
                      </div>
                    </div>

                    {/* Expertise */}
                    {tutor.expertise && tutor.expertise.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-[#5C5C5C] mb-2">Expertise:</p>
                        <div className="flex flex-wrap gap-1">
                          {tutor.expertise.slice(0, 3).map((exp, idx) => (
                            <Badge key={idx} className="bg-[#C17F59]/10 text-[#C17F59] border-0">{exp}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Session Details */}
                    <div className="border-t border-[#C17F59]/10 pt-4">
                      <h4 className="font-semibold text-[#5C5C5C] mb-2">Session Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#5C5C5C]/70">Date:</span>
                          <span className="text-[#5C5C5C]">{format(selectedDate, "MMM dd, yyyy")}</span>
                        </div>
                        {selectedSlot && (
                          <div className="flex justify-between">
                            <span className="text-[#5C5C5C]/70">Time:</span>
                            <span className="text-[#5C5C5C]">{selectedSlot}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[#5C5C5C]/70">Duration:</span>
                          <span className="text-[#5C5C5C]">1 hour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
