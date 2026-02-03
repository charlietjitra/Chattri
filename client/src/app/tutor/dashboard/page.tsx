'use client'

import { useState, useEffect } from 'react'
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
  DollarSign, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  Users
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
  }, [isAuthenticated, user])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const bookingsData = await bookingsApi.getMyBookings()
      setBookings(bookingsData)
      
      // Calculate stats
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
  }

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      await bookingsApi.accept(bookingId)
      await fetchDashboardData() // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to accept booking')
    }
  }

  const handleRejectBooking = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):')
    try {
      await bookingsApi.reject(bookingId, reason || undefined)
      await fetchDashboardData() // Refresh data
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject booking')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  // Get upcoming sessions (next 7 days)
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

  // Get recent pending bookings
  const pendingBookings = bookings
    .filter(b => b.status === 'pending')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  if (!isAuthenticated || user?.role !== 'tutor') {
    return null // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Manage your tutoring sessions and connect with students
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/tutor/profile">
                <Settings className="h-4 w-4 mr-2" />
                Profile Settings
              </Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600">
              <Link href="/tutor/bookings">
                <Calendar className="h-4 w-4 mr-2" />
                All Bookings
              </Link>
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
              <Button onClick={fetchDashboardData} variant="outline" className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingBookings}</div>
              <p className="text-xs text-muted-foreground">Awaiting your response</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Sessions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.confirmedBookings}</div>
              <p className="text-xs text-muted-foreground">Ready to teach</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.completedSessions}</div>
              <p className="text-xs text-muted-foreground">Sessions taught</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pending Booking Requests */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Requests
              </CardTitle>
              <CardDescription>
                New booking requests awaiting your response
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending requests</p>
                  <p className="text-sm">Great job staying on top of your bookings!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBookings.map((booking) => {
                    const { date, time } = formatDateTime(booking.scheduledStartTime)
                    return (
                      <Card key={booking.id} className="border-yellow-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={booking.student?.user?.avatarUrl || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
                                  {getInitials(booking.student?.user?.firstName, booking.student?.user?.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {booking.student?.user?.firstName} {booking.student?.user?.lastName}
                                </p>
                                <p className="text-sm text-gray-600">{date} at {time}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-green-600 to-emerald-600"
                              onClick={() => handleAcceptBooking(booking.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectBooking(booking.id)}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>
                Your confirmed sessions for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming sessions</p>
                  <p className="text-sm">Your schedule is clear for the next week</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((booking) => {
                    const { date, time } = formatDateTime(booking.scheduledStartTime)
                    return (
                      <Card key={booking.id} className="border-green-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={booking.student?.user?.avatarUrl || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
                                  {getInitials(booking.student?.user?.firstName, booking.student?.user?.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {booking.student?.user?.firstName} {booking.student?.user?.lastName}
                                </p>
                                <p className="text-sm text-gray-600">{date} at {time}</p>
                                {booking.student?.learningGoals && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Goals: {booking.student.learningGoals}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
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