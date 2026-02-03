"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { bookingsApi, sessionsApi } from "@/lib/api";
import {
  convertFromUTC,
  formatFullDateTimeWithTimezone,
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
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import type { Booking } from "@/types";

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const bookingsData = await bookingsApi.getMyBookings();
      setBookings(bookingsData);

      // Check session access for confirmed bookings
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
  };

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
        // Session might not exist yet, or access not available
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
      await fetchBookings(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to cancel booking");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
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

    // Convert UTC time to student's timezone
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

  const getAccessStatusColor = (status: string) => {
    switch (status) {
      case "pre_session":
        return "bg-blue-100 text-blue-800";
      case "during_session":
        return "bg-green-100 text-green-800";
      case "post_session":
        return "bg-yellow-100 text-yellow-800";
      case "too_early":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAccessStatusIcon = (status: string) => {
    switch (status) {
      case "pre_session":
        return <Clock className="h-3 w-3" />;
      case "during_session":
        return <MessageCircle className="h-3 w-3" />;
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            My Bookings
          </h1>
          <p className="text-gray-600">
            Manage your tutoring sessions and upcoming appointments
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <Button
                onClick={fetchBookings}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && bookings.length === 0 && (
          <Card className="border-purple-200 shadow-lg">
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't booked any sessions yet. Find a tutor and start
                learning!
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-blue-600"
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
                  className="border-purple-200 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={tutor?.avatarUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-lg">
                            {getInitials(tutor?.firstName, tutor?.lastName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Session with {tutor?.firstName} {tutor?.lastName}
                          </CardTitle>

                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {time} {timezone}
                              </span>
                            </div>
                          </div>

                          {/* Expertise for tutors */}
                          {booking.tutor?.expertise && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {booking.tutor.expertise
                                .slice(0, 3)
                                .map((exp, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {exp}
                                  </Badge>
                                ))}
                            </div>
                          )}

                          {/* Session Access Status */}
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
                        <Badge
                          className={`${getStatusColor(
                            booking.status
                          )} font-medium`}
                        >
                          {booking.status.charAt(0).toUpperCase() +
                            booking.status.slice(1)}
                        </Badge>

                        {/* Session Status Badge */}
                        {access?.session && (
                          <Badge variant="outline" className="text-xs">
                            Session: {access.session.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {/* Join Session Button - New Priority */}
                        {access && access.canMessage && access.sessionId && (
                          <Button
                            asChild
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            <Link
                              href={`/student/session?session=${access.sessionId}`}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Join Session
                            </Link>
                          </Button>
                        )}

                        {/* Video Platform Link - Legacy Fallback */}
                        {booking.status === "confirmed" &&
                          booking.tutor?.videoPlatformLink &&
                          !access?.canMessage && (
                            <Button
                              asChild
                              size="sm"
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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

                        {/* View Tutor Profile */}
                        {booking.tutor && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/student/tutors/${booking.tutorId}`}>
                              View Profile
                            </Link>
                          </Button>
                        )}
                        {/* Leave Review button for completed bookings */}
                        {booking.status === "completed" && !booking.review && (
                          <Button asChild size="sm">
                            <Link
                              href={`/student/reviews/new?booking=${booking.id}&tutor=${booking.tutorId}`}
                            >
                              Leave Review
                            </Link>
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* Cancel Button */}
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
                    </div>

                    {/* Cancellation Reason */}
                    {booking.status === "cancelled" &&
                      booking.cancellationReason && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
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
