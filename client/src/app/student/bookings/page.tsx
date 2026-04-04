"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { bookingsApi, sessionsApi } from "@/lib/api";
import {
  convertFromUTC,
  formatTimeWithTimezone,
} from "@/lib/timezone";
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
import {
  Calendar,
  Clock,
  User,
  Video,
  AlertCircle,
  Loader2,
  MessageCircle,
  ExternalLink,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface BookingWithDetails {
  id: string;
  studentId: string;
  tutorId: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: string;
  cancellationReason: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
  tutor?: {
    id: string;
    bio: string;
    expertise: string[];
    videoPlatformLink: string;
    user?: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      timeZone: string;
    };
  };
  student?: {
    id: string;
    bio: string | null;
    learningGoals: string | null;
    user?: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      timeZone: string;
    };
  };
  review?: {
    id: string;
    rating: number;
    reviewText?: string | null;
  };
}

interface SessionAccess {
  sessionId: string | null;
  accessStatus: string;
  accessMessage: string;
  canMessage: boolean;
  canStart: boolean;
  session?: {
    id: string;
    status: string;
    scheduledStart: string;
    scheduledEnd: string;
  };
}

export default function MyBookingsPage() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [sessionAccess, setSessionAccess] = useState<
    Record<string, SessionAccess>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const bookingsData = await bookingsApi.getMyBookings();
      setBookings(bookingsData);
      await checkSessionAccess(bookingsData);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(err.response?.data?.error || "Failed to load bookings");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, fetchBookings]);

  const checkSessionAccess = async (bookings: BookingWithDetails[]) => {
    const confirmedBookings = bookings.filter(
      (booking) => booking.status === "confirmed"
    );
    const accessPromises = confirmedBookings.map(async (booking) => {
      try {
        const sessionData = await sessionsApi.getSessionByBooking(booking.id);
        if (sessionData.session) {
          const accessData = await sessionsApi.checkSessionAccess(
            sessionData.session.id
          );
          return { bookingId: booking.id, access: accessData };
        }
      } catch (error) {
        return { bookingId: booking.id, access: null };
      }
    });

    const results = await Promise.all(accessPromises);
    const accessMap: Record<string, SessionAccess> = {};

    results.forEach((result) => {
      if (result && result.access) {
        accessMap[result.bookingId] = result.access;
      }
    });

    setSessionAccess(accessMap);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    const reason = prompt(
      "Please provide a reason for cancellation (optional):"
    );
    try {
      await bookingsApi.cancel(bookingId, reason || undefined);
      await fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to cancel booking");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20",
      confirmed: "bg-[#7D9D6A]/10 text-[#7D9D6A] border-[#7D9D6A]/20",
      rejected: "bg-red-100 text-red-600 border-red-200",
      cancelled: "bg-gray-100 text-gray-600 border-gray-200",
      completed: "bg-[#C17F59]/10 text-[#C17F59] border-[#C17F59]/20",
    };
    return styles[status] || "bg-gray-100 text-gray-600";
  };

  const getAccessStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pre_session: "bg-blue-100 text-blue-800",
      during_session: "bg-green-100 text-green-800",
      post_session: "bg-yellow-100 text-yellow-800",
      too_early: "bg-gray-100 text-gray-800",
      expired: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getAccessStatusIcon = (status: string) => {
    switch (status) {
      case "pre_session":
        return <Clock className="h-3 w-3" />;
      case "during_session":
      case "post_session":
        return <MessageCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const canCancelBooking = (booking: BookingWithDetails) => {
    const now = new Date();
    const sessionTime = new Date(booking.scheduledStartTime);
    const hoursDiff =
      (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return (
      booking.status === "pending" ||
      (booking.status === "confirmed" && hoursDiff > 2)
    );
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const formatDateTime = (dateString: string) => {
    if (!user?.timeZone) {
      const date = new Date(dateString);
      return {
        date: format(date, "MMMM dd, yyyy"),
        time: format(date, "h:mm a"),
        timezone: "",
      };
    }

    const zonedDate = convertFromUTC(dateString, user.timeZone);
    return {
      date: format(zonedDate, "MMMM dd, yyyy"),
      time: format(zonedDate, "h:mm a"),
      timezone: formatTimeWithTimezone(dateString, user.timeZone)
        .split(" ")
        .slice(1)
        .join(" "),
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md border-0 bg-white/60 backdrop-blur-sm organic-shadow">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-[#C17F59]" />
              </div>
              <CardTitle className="text-[#5C5C5C]">Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to view your bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-[#C17F59] hover:bg-[#B3714F]">
                <Link href="/login">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C17F59]/10 rounded-full mb-4">
            <CalendarDays className="h-4 w-4 text-[#C17F59]" />
            <span className="text-sm font-medium text-[#C17F59]">Your Sessions</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-[#5C5C5C]">My Bookings</h1>
          <p className="text-[#5C5C5C]/70">
            Manage your tutoring sessions and upcoming appointments
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <Button
                onClick={fetchBookings}
                variant="outline"
                className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && bookings.length === 0 && (
          <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-[#C17F59]/50" />
              </div>
              <h3 className="text-xl font-semibold text-[#5C5C5C] mb-2">No bookings yet</h3>
              <p className="text-[#5C5C5C]/70 mb-6">
                You haven't booked any sessions yet. Find a tutor and start learning!
              </p>
              <Button
                asChild
                className="bg-[#C17F59] hover:bg-[#B3714F]"
              >
                <Link href="/student/tutors">Browse Tutors</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const { date, time, timezone } = formatDateTime(
                booking.scheduledStartTime
              );
              const tutor = booking.tutor?.user;
              const access = sessionAccess[booking.id];

              return (
                <Card
                  key={booking.id}
                  className="border-0 bg-white/60 backdrop-blur-sm organic-shadow hover-lift"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 border-2 border-[#C17F59]/20">
                          <AvatarImage src={tutor?.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] text-white">
                            {getInitials(tutor?.firstName, tutor?.lastName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-[#5C5C5C]">
                            <User className="h-5 w-5 text-[#C17F59]" />
                            Session with {tutor?.firstName} {tutor?.lastName}
                          </CardTitle>

                          <div className="flex items-center gap-4 mt-2 text-sm text-[#5C5C5C]/70">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{time} {timezone}</span>
                            </div>
                          </div>

                          {booking.tutor?.expertise && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {booking.tutor.expertise
                                .slice(0, 3)
                                .map((exp) => (
                                  <Badge key={exp} className="text-xs bg-[#7D9D6A]/10 text-[#7D9D6A] border-0">
                                    {exp}
                                  </Badge>
                                ))}
                            </div>
                          )}

                          {access && (
                            <div className="mt-2">
                              <Badge
                                className={`${getAccessStatusColor(
                                  access.accessStatus
                                )} text-xs flex items-center gap-1 w-fit`}
                              >
                                {getAccessStatusIcon(access.accessStatus)}
                                {access.accessMessage}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`${getStatusBadge(booking.status)} font-medium`}>
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </Badge>
                        {access?.session && (
                          <Badge variant="outline" className="text-xs border-[#C17F59]/20 text-[#C17F59]">
                            Session: {access.session.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex gap-2 flex-wrap">
                        {access && access.canMessage && access.sessionId && (
                          <Button
                            asChild
                            size="sm"
                            className="bg-[#C17F59] hover:bg-[#B3714F]"
                          >
                            <Link href={`/student/session?session=${access.sessionId}`}>
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Join Session
                            </Link>
                          </Button>
                        )}

                        {booking.status === "confirmed" &&
                          booking.tutor?.videoPlatformLink &&
                          !access?.canMessage && (
                            <Button
                              asChild
                              size="sm"
                              className="bg-[#7D9D6A] hover:bg-[#6D8C5A]"
                            >
                              <a
                                href={booking.tutor.videoPlatformLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Video Call
                              </a>
                            </Button>
                          )}

                        {booking.tutor && (
                          <Button asChild variant="outline" size="sm" className="border-[#C17F59]/20 text-[#C17F59] hover:bg-[#C17F59]/5">
                            <Link href={`/student/tutors/${booking.tutorId}`}>
                              View Profile
                            </Link>
                          </Button>
                        )}

                        {booking.status === "completed" && !booking.review && (
                          <Button asChild size="sm" className="bg-[#7D9D6A] hover:bg-[#6D8C5A]">
                            <Link href={`/student/reviews/new?booking=${booking.id}&tutor=${booking.tutorId}`}>
                              Leave Review
                            </Link>
                          </Button>
                        )}
                      </div>

                      {canCancelBooking(booking) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>

                    {booking.status === "cancelled" &&
                      booking.cancellationReason && (
                        <div className="mt-4 p-3 bg-red-50/50 rounded-xl border border-red-100">
                          <p className="text-sm text-red-700">
                            <strong>Cancellation reason:</strong>{" "}
                            {booking.cancellationReason}
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}