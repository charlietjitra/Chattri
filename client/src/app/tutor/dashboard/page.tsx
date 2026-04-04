'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { bookingsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  Users,
  GraduationCap,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedSessions: number
}

interface BookingWithDetails {
  id: string
  studentId: string
  tutorId: string
  scheduledStartTime: string
  scheduledEndTime: string
  status: string
  cancellationReason: string | null
  cancelledBy: string | null
  createdAt: string
  updatedAt: string
  student?: {
    id: string
    bio: string | null
    learningGoals: string | null
    user?: {
      firstName: string
      lastName: string
      avatarUrl: string | null
      timeZone: string
    }
  }
}

export default function TutorDashboard() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedSessions: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const bookingsData = await bookingsApi.getMyBookings()
      setBookings(bookingsData)
      
      const stats: DashboardStats = {
        totalBookings: bookingsData.length,
        pendingBookings: bookingsData.filter(b => b.status === 'pending').length,
        confirmedBookings: bookingsData.filter(b => b.status === 'confirmed').length,
        completedSessions: bookingsData.filter(b => b.status === 'completed').length
      }
      setStats(stats)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (user?.role !== 'tutor') {
      router.push('/student/tutors')
      return
    }

    fetchDashboardData()
  }, [isAuthenticated, user, router, fetchDashboardData])

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await bookingsApi.accept(bookingId)
      await fetchDashboardData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to accept booking')
    }
  }

  const handleRejectBooking = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):')
    try {
      await bookingsApi.reject(bookingId, reason || undefined)
      await fetchDashboardData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject booking')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20',
      confirmed: 'bg-[#7D9D6A]/10 text-[#7D9D6A] border-[#7D9D6A]/20',
      rejected: 'bg-red-100 text-red-600 border-red-200',
      cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
      completed: 'bg-[#C17F59]/10 text-[#C17F59] border-[#C17F59]/20',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600'
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'h:mm a'),
    }
  }

  const upcomingSessions = bookings
    .filter(b => b.status === 'confirmed')
    .filter(b => {
      const sessionDate = new Date(b.scheduledStartTime)
      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return sessionDate >= now && sessionDate <= weekFromNow
    })
    .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
    .slice(0, 5)

  const pendingBookingsList = bookings
    .filter(b => b.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (!isAuthenticated || user?.role !== 'tutor') {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#7D9D6A]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#7D9D6A]/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/3" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#C17F59]/5 rounded-full blur-[100px] translate-y-1/3 translate-x-1/3" />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7D9D6A]/10 rounded-full mb-4">
              <GraduationCap className="h-4 w-4 text-[#7D9D6A]" />
              <span className="text-sm font-medium text-[#7D9D6A]">Tutor Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-[#5C5C5C]">Welcome back, {user?.firstName}!</h1>
            <p className="text-[#5C5C5C]/70">Manage your tutoring sessions and connect with students</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-[#7D9D6A]/20 text-[#7D9D6A] hover:bg-[#7D9D6A]/5">
              <Link href="/tutor/profile">
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            <Button asChild className="bg-[#7D9D6A] hover:bg-[#6D8C5A]">
              <Link href="/tutor/bookings">
                <Calendar className="h-4 w-4 mr-2" />
                All Bookings
              </Link>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <Button onClick={fetchDashboardData} variant="outline" className="mt-4 border-red-200 text-red-600 hover:bg-red-50">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.totalBookings, icon: BookOpen, color: 'terracotta' },
            { label: 'Pending Requests', value: stats.pendingBookings, icon: Clock, color: 'gold' },
            { label: 'Confirmed Sessions', value: stats.confirmedBookings, icon: CheckCircle, color: 'sage' },
            { label: 'Completed', value: stats.completedSessions, icon: TrendingUp, color: 'terracotta' },
          ].map((stat) => (
            <Card key={stat.label} className="hover-lift organic-shadow border-0 bg-white/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    stat.color === 'terracotta' ? 'bg-[#C17F59]/10' :
                    stat.color === 'sage' ? 'bg-[#7D9D6A]/10' :
                    'bg-[#D4A853]/10'
                  }`}>
                    <stat.icon className={`h-6 w-6 ${
                      stat.color === 'terracotta' ? 'text-[#C17F59]' :
                      stat.color === 'sage' ? 'text-[#7D9D6A]' :
                      'text-[#D4A853]'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-[#5C5C5C]/70">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#5C5C5C]">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Booking Requests */}
          <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#5C5C5C]">
                  <div className="p-2 bg-[#D4A853]/10 rounded-lg">
                    <Clock className="h-5 w-5 text-[#D4A853]" />
                  </div>
                  Pending Requests
                </CardTitle>
                <Badge className={getStatusBadge('pending')}>
                  {pendingBookingsList.length} new
                </Badge>
              </div>
              <CardDescription className="text-[#5C5C5C]/70">
                New booking requests awaiting your response
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingBookingsList.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#7D9D6A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-[#7D9D6A]/50" />
                  </div>
                  <p className="text-[#5C5C5C]/70">No pending requests</p>
                  <p className="text-sm text-[#5C5C5C]/50">Great job staying on top of your bookings!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBookingsList.map((booking) => {
                    const { date, time } = formatDateTime(booking.scheduledStartTime)
                    return (
                      <div
                        key={booking.id}
                        className="border border-[#D4A853]/20 rounded-xl p-4 hover:bg-white/80 hover:border-[#D4A853]/40 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border-2 border-[#D4A853]/20">
                              <AvatarImage src={booking.student?.user?.avatarUrl || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-[#D4A853] to-[#C17F59] text-white">
                                {getInitials(booking.student?.user?.firstName, booking.student?.user?.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-[#5C5C5C]">
                                {booking.student?.user?.firstName} {booking.student?.user?.lastName}
                              </p>
                              <p className="text-sm text-[#5C5C5C]/70">{date} at {time}</p>
                            </div>
                          </div>
                          <Badge className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-[#7D9D6A] hover:bg-[#6D8C5A]"
                            onClick={() => handleAcceptBooking(booking.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleRejectBooking(booking.id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#5C5C5C]">
                  <div className="p-2 bg-[#7D9D6A]/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-[#7D9D6A]" />
                  </div>
                  Upcoming Sessions
                </CardTitle>
              </div>
              <CardDescription className="text-[#5C5C5C]/70">
                Your confirmed sessions for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-[#C17F59]/50" />
                  </div>
                  <p className="text-[#5C5C5C]/70">No upcoming sessions</p>
                  <p className="text-sm text-[#5C5C5C]/50">Your schedule is clear for the next week</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((booking) => {
                    const { date, time } = formatDateTime(booking.scheduledStartTime)
                    return (
                      <div
                        key={booking.id}
                        className="border border-[#7D9D6A]/20 rounded-xl p-4 hover:bg-white/80 hover:border-[#7D9D6A]/40 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 border-2 border-[#7D9D6A]/20">
                              <AvatarImage src={booking.student?.user?.avatarUrl || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-[#7D9D6A] to-[#C17F59] text-white">
                                {getInitials(booking.student?.user?.firstName, booking.student?.user?.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-[#5C5C5C]">
                                {booking.student?.user?.firstName} {booking.student?.user?.lastName}
                              </p>
                              <p className="text-sm text-[#5C5C5C]/70">{date} at {time}</p>
                              {booking.student?.learningGoals && (
                                <p className="text-xs text-[#5C5C5C]/50 mt-1 line-clamp-1">
                                  Goals: {booking.student.learningGoals}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusBadge(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}