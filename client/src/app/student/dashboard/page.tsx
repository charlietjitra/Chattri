'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { bookingsApi, sessionsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Calendar,
  Clock,
  User,
  MessageCircle,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Star,
  Zap,
  TrendingUp
} from 'lucide-react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'

interface BookingWithDetails {
  id: string
  studentId: string
  tutorId: string
  scheduledStartTime: string
  scheduledEndTime: string
  status: string
  cancellationReason: string | null
  tutor?: {
    id: string
    bio: string
    expertise: string[]
    videoPlatformLink: string
    user?: {
      firstName: string
      lastName: string
      avatarUrl: string | null
    }
  }
  review?: {
    id: string
    rating: number
  }
}

export default function StudentDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()

  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, isLoading, router])

  // Fetch bookings
  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      fetchBookings()
    }
  }, [isAuthenticated, user])

  const fetchBookings = async () => {
    try {
      setIsLoadingBookings(true)
      const data = await bookingsApi.getMyBookings()
      // Sort by scheduled start time, most recent first
      const sorted = data.sort(
        (a, b) =>
          new Date(b.scheduledStartTime).getTime() -
          new Date(a.scheduledStartTime).getTime()
      )
      setBookings(sorted)
    } catch (err: any) {
      console.error('Failed to load bookings:', err)
      setError('Failed to load bookings')
    } finally {
      setIsLoadingBookings(false)
    }
  }

  // Calculate stats
  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    upcoming: bookings.filter(
      b =>
        b.status === 'confirmed' &&
        !isPast(new Date(b.scheduledStartTime))
    ).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  const upcomingBookings = bookings
    .filter(
      b =>
        b.status === 'confirmed' &&
        !isPast(new Date(b.scheduledStartTime))
    )
    .slice(0, 3)

  const completedBookings = bookings
    .filter(b => b.status === 'completed')
    .slice(0, 3)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-600">Here's your learning journey at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Upcoming Sessions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>
                {upcomingBookings.length === 0
                  ? 'No upcoming sessions scheduled'
                  : `You have ${upcomingBookings.length} upcoming session${upcomingBookings.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingBookings ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-4">No upcoming sessions</p>
                  <Link href="/student/tutors">
                    <Button>Find a Tutor</Button>
                  </Link>
                </div>
              ) : (
                upcomingBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={booking.tutor?.user?.avatarUrl || undefined} />
                          <AvatarFallback>
                            {booking.tutor?.user?.firstName?.[0]}
                            {booking.tutor?.user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {booking.tutor?.user?.firstName}{' '}
                            {booking.tutor?.user?.lastName}
                          </h3>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {format(
                                new Date(booking.scheduledStartTime),
                                'MMM d, yyyy • h:mm a'
                              )}
                            </div>
                            {booking.tutor?.expertise && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {booking.tutor.expertise.slice(0, 2).map(exp => (
                                  <Badge key={exp} variant="secondary" className="text-xs">
                                    {exp}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/student/session?booking=${booking.id}`}>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {upcomingBookings.length > 0 && (
                <Link href="/student/bookings">
                  <Button variant="outline" className="w-full">
                    View All Bookings
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Recent Completed Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription>Sessions you've completed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {completedBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No completed sessions yet</p>
                </div>
              ) : (
                completedBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.tutor?.user?.avatarUrl || undefined} />
                          <AvatarFallback>
                            {booking.tutor?.user?.firstName?.[0]}
                            {booking.tutor?.user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {booking.tutor?.user?.firstName}{' '}
                            {booking.tutor?.user?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(
                              new Date(booking.scheduledStartTime),
                              'MMM d, yyyy'
                            )}
                          </p>
                        </div>
                      </div>
                      {booking.review ? (
                        <div className="flex items-center gap-1">
                          {[...Array(booking.review.rating)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      ) : (
                        <Link href={`/student/reviews?booking=${booking.id}`}>
                          <Button size="sm" variant="outline">
                            Leave Review
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/student/tutors">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <User className="h-4 w-4 mr-2" />
                  Find a Tutor
                </Button>
              </Link>
              <Link href="/student/bookings">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Bookings
                </Button>
              </Link>
              <Link href="/student/reviews">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <Star className="h-4 w-4 mr-2" />
                  My Reviews
                </Button>
              </Link>
              <Link href="/student/profile">
                <Button variant="outline" className="w-full justify-start" size="lg">
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Sessions Completed</p>
                  <p className="text-lg font-bold">{stats.completed}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Reviews Left</p>
                  <p className="text-lg font-bold">
                    {completedBookings.filter(b => b.review).length} /{' '}
                    {stats.completed}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${stats.completed > 0 ? (completedBookings.filter(b => b.review).length / stats.completed) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
