"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { bookingsApi, sessionsApi } from "@/lib/api";
import { convertFromUTC, formatTimeWithTimezone } from "@/lib/timezone";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  MessageSquare,
  Phone,
  MessageCircle,
  Play,
  ExternalLink,
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

export default function TutorBookingsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [sessionAccess, setSessionAccess] = useState<
    Record<string, SessionAccess>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.role !== "tutor") {
      router.push("/student/tutors");
      return;
    }

    fetchBookings();
  }, [isAuthenticated, user]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const bookingsData = await bookingsApi.getMyBookings();
      setBookings(bookingsData);

      // Check session access for confirmed bookings
      await checkSessionAccess(bookingsData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load bookings");
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

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await bookingsApi.accept(bookingId);
      await fetchBookings(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to accept booking");
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    const reason = prompt("Please provide a reason for rejection (optional):");
    try {
      await bookingsApi.reject(bookingId, reason || undefined);
      await fetchBookings(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to reject booking");
    }
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
        dayOfWeek: format(date, "EEEE"),
      };
    }

    // Convert UTC time to tutor's timezone
    const zonedDate = convertFromUTC(dateString, user.timeZone);
    return {
      date: format(zonedDate, "MMMM dd, yyyy"),
      time: format(zonedDate, "h:mm a"),
      timezone: formatTimeWithTimezone(dateString, user.timeZone)
        .split(" ")
        .slice(1)
        .join(" "),
      dayOfWeek: format(zonedDate, "EEEE"),
    };
  };

  const canCancelBooking = (booking: BookingWithDetails) => {
    const now = new Date();
    const sessionTime = new Date(booking.scheduledStartTime);
    const hoursDiff =
      (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return booking.status === "confirmed" && hoursDiff > 2;
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

  // Filter bookings by status
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const cancelledRejectedBookings = bookings.filter((b) =>
    ["cancelled", "rejected"].includes(b.status)
  );

  const renderBookingCard = (booking: BookingWithDetails) => {
    const { date, time, timezone, dayOfWeek } = formatDateTime(
      booking.scheduledStartTime
    );
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
                <AvatarImage
                  src={booking.student?.user?.avatarUrl || undefined}
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-lg">
                  {getInitials(
                    booking.student?.user?.firstName,
                    booking.student?.user?.lastName
                  )}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Session with {booking.student?.user?.firstName}{" "}
                  {booking.student?.user?.lastName}
                </CardTitle>

                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {dayOfWeek}, {date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {time} {timezone}
                    </span>
                  </div>
                </div>

                {/* Student Info */}
                {booking.student?.learningGoals && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Learning Goals:</strong>{" "}
                      {booking.student.learningGoals}
                    </p>
                  </div>
                )}

                {booking.student?.bio && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      <strong>About:</strong> {booking.student.bio}
                    </p>
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
                className={`${getStatusColor(booking.status)} font-medium`}
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
              {/* Session Controls - Priority for confirmed bookings */}
              {booking.status === "confirmed" && access && (
                <>
                  {/* Start/Join Session Button */}
                  {(access.canStart || access.canMessage) &&
                    access.sessionId && (
                      <Button
                        asChild
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Link
                          href={`/tutor/session?session=${access.sessionId}`}
                        >
                          {access.canStart ? (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Start Session
                            </>
                          ) : (
                            <>
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Join Session
                            </>
                          )}
                        </Link>
                      </Button>
                    )}
                </>
              )}

              {/* Actions based on status */}
              {booking.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                    onClick={() => handleAcceptBooking(booking.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRejectBooking(booking.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}

              {/* Legacy contact for confirmed without session access */}
              {booking.status === "confirmed" && !access?.canMessage && (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={`mailto:${booking.student?.user?.firstName?.toLowerCase()}.${booking.student?.user?.lastName?.toLowerCase()}@example.com`}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </a>
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {/* Cancel Button for confirmed bookings */}
              {canCancelBooking(booking) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelBooking(booking.id)}
                >
                  Cancel Session
                </Button>
              )}

              <div className="text-xs text-gray-500">
                Booked {format(new Date(booking.createdAt), "MMM dd")}
              </div>
            </div>
          </div>

          {/* Cancellation/Rejection Reason */}
          {(booking.status === "cancelled" || booking.status === "rejected") &&
            booking.cancellationReason && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Reason:</strong> {booking.cancellationReason}
                </p>
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

  if (!isAuthenticated || user?.role !== "tutor") {
    return null; // Will redirect in useEffect
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                My Bookings
              </h1>
              <p className="text-gray-600">
                Manage your tutoring sessions and student requests
              </p>
            </div>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/tutor/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
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

        {/* Tabs for different booking statuses */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmed ({confirmedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Completed ({completedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Cancelled/Rejected ({cancelledRejectedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {pendingBookings.length === 0 ? (
                <Card className="border-purple-200 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      No pending requests
                    </h3>
                    <p className="text-gray-600">
                      All caught up! New booking requests will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingBookings.map(renderBookingCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="confirmed" className="mt-6">
            <div className="space-y-4">
              {confirmedBookings.length === 0 ? (
                <Card className="border-purple-200 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      No confirmed sessions
                    </h3>
                    <p className="text-gray-600">
                      Confirmed sessions will appear here when students book
                      with you.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                confirmedBookings
                  .sort(
                    (a, b) =>
                      new Date(a.scheduledStartTime).getTime() -
                      new Date(b.scheduledStartTime).getTime()
                  )
                  .map(renderBookingCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {completedBookings.length === 0 ? (
                <Card className="border-purple-200 shadow-lg">
                  <CardContent className="text-center py-12">
                    <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      No completed sessions
                    </h3>
                    <p className="text-gray-600">
                      Your completed tutoring sessions will be listed here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedBookings
                  .sort(
                    (a, b) =>
                      new Date(b.scheduledStartTime).getTime() -
                      new Date(a.scheduledStartTime).getTime()
                  )
                  .map(renderBookingCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="mt-6">
            <div className="space-y-4">
              {cancelledRejectedBookings.length === 0 ? (
                <Card className="border-purple-200 shadow-lg">
                  <CardContent className="text-center py-12">
                    <XCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      No cancelled sessions
                    </h3>
                    <p className="text-gray-600">
                      Cancelled or rejected bookings will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                cancelledRejectedBookings
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() -
                      new Date(a.updatedAt).getTime()
                  )
                  .map(renderBookingCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
