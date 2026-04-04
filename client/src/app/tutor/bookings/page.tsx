"use client";

import { useState, useEffect, useCallback } from "react";
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
  MessageCircle,
  Play,
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
  const [sessionAccess, setSessionAccess] = useState<Record<string, SessionAccess>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const bookingsData = await bookingsApi.getMyBookings();
      setBookings(bookingsData);
      await checkSessionAccess(bookingsData);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  }, [isAuthenticated, user, router, fetchBookings]);

  const checkSessionAccess = async (bookings: BookingWithDetails[]) => {
    const confirmedBookings = bookings.filter((booking) => booking.status === "confirmed");
    const accessPromises = confirmedBookings.map(async (booking) => {
      try {
        const sessionData = await sessionsApi.getSessionByBooking(booking.id);
        if (sessionData.session) {
          const accessData = await sessionsApi.checkSessionAccess(sessionData.session.id);
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

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await bookingsApi.accept(bookingId);
      await fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to accept booking");
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    const reason = prompt("Please provide a reason for rejection (optional):");
    try {
      await bookingsApi.reject(bookingId, reason || undefined);
      await fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to reject booking");
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

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const formatDateTime = (dateString: string) => {
    if (!user?.timeZone) {
      const date = new Date(dateString);
      return { date: format(date, "MMMM dd, yyyy"), time: format(date, "h:mm a"), timezone: "", dayOfWeek: format(date, "EEEE") };
    }
    const zonedDate = convertFromUTC(dateString, user.timeZone);
    return {
      date: format(zonedDate, "MMMM dd, yyyy"),
      time: format(zonedDate, "h:mm a"),
      timezone: formatTimeWithTimezone(dateString, user.timeZone).split(" ").slice(1).join(" "),
      dayOfWeek: format(zonedDate, "EEEE"),
    };
  };

  const getAccessStatusIcon = (status: string) => {
    switch (status) {
      case "pre_session": return <Clock className="h-3 w-3" />;
      case "during_session":
      case "post_session": return <MessageCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
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

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const cancelledRejectedBookings = bookings.filter((b) => ["cancelled", "rejected"].includes(b.status));

  const renderBookingCard = (booking: BookingWithDetails) => {
    const { date, time, timezone, dayOfWeek } = formatDateTime(booking.scheduledStartTime);
    const access = sessionAccess[booking.id];

    return (
      <Card key={booking.id} className="border-0 bg-white/60 backdrop-blur-sm organic-shadow hover-lift">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border-2 border-[#7D9D6A]/20">
                <AvatarImage src={booking.student?.user?.avatarUrl || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#7D9D6A] to-[#C17F59] text-white">
                  {getInitials(booking.student?.user?.firstName, booking.student?.user?.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-[#5C5C5C]">
                  <User className="h-5 w-5 text-[#7D9D6A]" />
                  Session with {booking.student?.user?.firstName} {booking.student?.user?.lastName}
                </CardTitle>

                <div className="flex items-center gap-4 mt-2 text-sm text-[#5C5C5C]/70">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{dayOfWeek}, {date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{time} {timezone}</span>
                  </div>
                </div>

                {booking.student?.learningGoals && (
                  <div className="mt-2 p-2 bg-[#7D9D6A]/5 rounded-lg">
                    <p className="text-sm text-[#5C5C5C]">
                      <strong>Learning Goals:</strong> {booking.student.learningGoals}
                    </p>
                  </div>
                )}

                {access && (
                  <div className="mt-2">
                    <Badge className={`${getAccessStatusColor(access.accessStatus)} text-xs flex items-center gap-1 w-fit`}>
                      {getAccessStatusIcon(access.accessStatus)}
                      {access.accessMessage}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={`${getStatusBadge(booking.status)} font-medium`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
              {access?.session && (
                <Badge variant="outline" className="text-xs border-[#7D9D6A]/20 text-[#7D9D6A]">
                  Session: {access.session.status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2 flex-wrap">
              {booking.status === "confirmed" && access && (access.canStart || access.canMessage) && access.sessionId && (
                <Button asChild size="sm" className="bg-[#7D9D6A] hover:bg-[#6D8C5A]">
                  <Link href={`/tutor/session?session=${access.sessionId}`}>
                    {access.canStart ? <><Play className="h-4 w-4 mr-1" /> Start Session</> : <><MessageCircle className="h-4 w-4 mr-1" /> Join Session</>}
                  </Link>
                </Button>
              )}

              {booking.status === "pending" && (
                <>
                  <Button size="sm" className="bg-[#7D9D6A] hover:bg-[#6D8C5A]" onClick={() => handleAcceptBooking(booking.id)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleRejectBooking(booking.id)}>
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </>
              )}
            </div>

            <div className="text-xs text-[#5C5C5C]/50">
              Booked {format(new Date(booking.createdAt), "MMM dd")}
            </div>
          </div>

          {(booking.status === "cancelled" || booking.status === "rejected") && booking.cancellationReason && (
            <div className="mt-4 p-3 bg-red-50/50 rounded-xl border border-red-100">
              <p className="text-sm text-red-700"><strong>Reason:</strong> {booking.cancellationReason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!isAuthenticated || user?.role !== "tutor") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#7D9D6A]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-20 left-0 w-96 h-96 bg-[#7D9D6A]/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/3" />
      <div className="absolute bottom-20 right-0 w-80 h-80 bg-[#C17F59]/5 rounded-full blur-[100px] translate-y-1/3 translate-x-1/3" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7D9D6A]/10 rounded-full mb-4">
              <CalendarDays className="h-4 w-4 text-[#7D9D6A]" />
              <span className="text-sm font-medium text-[#7D9D6A]">Your Sessions</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-[#5C5C5C]">My Bookings</h1>
            <p className="text-[#5C5C5C]/70">Manage your tutoring sessions and student requests</p>
          </div>
          <Button variant="ghost" asChild className="text-[#7D9D6A] hover:bg-[#7D9D6A]/5">
            <Link href="/tutor/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <Button onClick={fetchBookings} variant="outline" className="mt-4 border-red-200 text-red-600 hover:bg-red-50">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm">
            <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-[#D4A853]/20 data-[state=active]:text-[#D4A853]">
              <Clock className="h-4 w-4" />
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="flex items-center gap-2 data-[state=active]:bg-[#7D9D6A]/20 data-[state=active]:text-[#7D9D6A]">
              <CheckCircle className="h-4 w-4" />
              Confirmed ({confirmedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2 data-[state=active]:bg-[#C17F59]/20 data-[state=active]:text-[#C17F59]">
              <User className="h-4 w-4" />
              Completed ({completedBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2 data-[state=active]:bg-gray-200 data-[state=active]:text-gray-600">
              <XCircle className="h-4 w-4" />
              Cancelled ({cancelledRejectedBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              {pendingBookings.length === 0 ? (
                <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-[#D4A853]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-[#D4A853]/50" />
                    </div>
                    <p className="text-[#5C5C5C]/70">No pending booking requests</p>
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
                <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-[#7D9D6A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-[#7D9D6A]/50" />
                    </div>
                    <p className="text-[#5C5C5C]/70">No confirmed bookings</p>
                  </CardContent>
                </Card>
              ) : (
                confirmedBookings.map(renderBookingCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {completedBookings.length === 0 ? (
                <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-8 w-8 text-[#C17F59]/50" />
                    </div>
                    <p className="text-[#5C5C5C]/70">No completed sessions yet</p>
                  </CardContent>
                </Card>
              ) : (
                completedBookings.map(renderBookingCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="mt-6">
            <div className="space-y-4">
              {cancelledRejectedBookings.length === 0 ? (
                <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
                  <CardContent className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-[#5C5C5C]/70">No cancelled or rejected bookings</p>
                  </CardContent>
                </Card>
              ) : (
                cancelledRejectedBookings.map(renderBookingCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}