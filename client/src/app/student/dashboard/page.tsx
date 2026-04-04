'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { bookingsApi } from '@/lib/api'
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
  TrendingUp,
  Search,
  GraduationCap
} from 'lucide-react'
import { format, isPast } from 'date-fns'

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

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'student')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, isLoading, router])

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoadingBookings(true)
      const data = await bookingsApi.getMyBookings()
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
  }, [])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      fetchBookings()
    }
  }, [isAuthenticated, user, fetchBookings])

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
      <div className="min-h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
        <div className="relative flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C17F59]"></div>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-[#7D9D6A]/10 text-[#7D9D6A] border-[#7D9D6A]/20',
      pending: 'bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20',
      completed: 'bg-[#C17F59]/10 text-[#C17F59] border-[#C17F59]/20',
      cancelled: 'bg-red-100 text-red-600 border-red-200',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-[#FDFCFA] to-[#F5F0E8]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C17F59]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#7D9D6A]/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
      
      <div className="relative container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C17F59]/10 rounded-full mb-4">
            <GraduationCap className="h-4 w-4 text-[#C17F59]" />
            <span className="text-sm font-medium text-[#C17F59]">Student Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-[#5C5C5C]">Welcome back, {user?.firstName}!</h1>
          <p className="text-[#5C5C5C]/70">Here's your learning journey at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total, icon: Calendar, color: 'terracotta' },
            { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'sage' },
            { label: 'Completed', value: stats.completed, icon: TrendingUp, color: 'gold' },
            { label: 'Confirmed', value: stats.confirmed, icon: BookOpen, color: 'terracotta' },
            { label: 'Cancelled', value: stats.cancelled, icon: AlertCircle, color: 'red' },
          ].map((stat) => (
            <Card key={stat.label} className="hover-lift organic-shadow border-0 bg-white/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    stat.color === 'terracotta' ? 'bg-[#C17F59]/10' :
                    stat.color === 'sage' ? 'bg-[#7D9D6A]/10' :
                    stat.color === 'gold' ? 'bg-[#D4A853]/10' :
                    'bg-red-100'
                  }`}>
                    <stat.icon className={`h-6 w-6 ${
                      stat.color === 'terracotta' ? 'text-[#C17F59]' :
                      stat.color === 'sage' ? 'text-[#7D9D6A]' :
                      stat.color === 'gold' ? 'text-[#D4A853]' :
                      'text-red-600'
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

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-sm">
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
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[#5C5C5C]">
                    <div className="p-2 bg-[#C17F59]/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-[#C17F59]" />
                    </div>
                    Upcoming Sessions
                  </CardTitle>
                  <Badge variant="secondary" className="bg-[#C17F59]/10 text-[#C17F59]">
                    {upcomingBookings.length}
                  </Badge>
                </div>
                <CardDescription className="text-[#5C5C5C]/70">
                  {upcomingBookings.length === 0
                    ? 'No upcoming sessions scheduled'
                    : `You have ${upcomingBookings.length} upcoming session${upcomingBookings.length !== 1 ? 's' : ''}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingBookings ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C17F59]"></div>
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#C17F59]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-[#C17F59]/50" />
                    </div>
                    <p className="text-[#5C5C5C]/70 mb-4">No upcoming sessions</p>
                    <Button asChild className="bg-[#C17F59] hover:bg-[#B3714F]">
                      <Link href="/student/tutors">Find a Tutor</Link>
                    </Button>
                  </div>
                ) : (
                  upcomingBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="group border border-[#C17F59]/10 rounded-xl p-4 hover:bg-white/80 hover:border-[#C17F59]/30 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-12 w-12 border-2 border-[#C17F59]/20">
                            <AvatarImage src={booking.tutor?.user?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-[#C17F59] to-[#7D9D6A] text-white">
                              {booking.tutor?.user?.firstName?.[0]}
                              {booking.tutor?.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#5C5C5C]">
                              {booking.tutor?.user?.firstName}{' '}
                              {booking.tutor?.user?.lastName}
                            </h3>
                            <div className="space-y-2 mt-2">
                              <div className="flex items-center gap-2 text-sm text-[#5C5C5C]/70">
                                <Clock className="h-4 w-4" />
                                {format(
                                  new Date(booking.scheduledStartTime),
                                  'MMM d, yyyy • h:mm a'
                                )}
                              </div>
                              {booking.tutor?.expertise && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {booking.tutor.expertise.slice(0, 2).map(exp => (
                                    <Badge key={exp} className={`text-xs ${getStatusBadge('confirmed')}`}>
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
                            <Button size="sm" variant="outline" className="border-[#C17F59]/20 hover:bg-[#C17F59]/5">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {upcomingBookings.length > 0 && (
                  <Link href="/student/bookings">
                    <Button variant="outline" className="w-full border-[#C17F59]/20 text-[#C17F59] hover:bg-[#C17F59]/5">
                      View All Bookings
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Recent Completed Sessions */}
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[#5C5C5C]">
                    <div className="p-2 bg-[#7D9D6A]/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-[#7D9D6A]" />
                    </div>
                    Recent Sessions
                  </CardTitle>
                </div>
                <CardDescription className="text-[#5C5C5C]/70">Sessions you've completed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#7D9D6A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-[#7D9D6A]/50" />
                    </div>
                    <p className="text-[#5C5C5C]/70">No completed sessions yet</p>
                  </div>
                ) : (
                  completedBookings.map(booking => (
                    <div
                      key={booking.id}
                      className="group border border-[#7D9D6A]/10 rounded-xl p-4 hover:bg-white/80 hover:border-[#7D9D6A]/30 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={booking.tutor?.user?.avatarUrl || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-[#7D9D6A] to-[#C17F59] text-white text-sm">
                              {booking.tutor?.user?.firstName?.[0]}
                              {booking.tutor?.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[#5C5C5C]">
                              {booking.tutor?.user?.firstName}{' '}
                              {booking.tutor?.user?.lastName}
                            </p>
                            <p className="text-sm text-[#5C5C5C]/70">
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
                                key={`review-star-${booking.id}-${i}`}
                                className="h-4 w-4 fill-[#D4A853] text-[#D4A853]"
                              />
                            ))}
                          </div>
                        ) : (
                          <Link href={`/student/reviews/new?booking=${booking.id}`}>
                            <Button size="sm" variant="outline" className="border-[#7D9D6A]/20 text-[#7D9D6A] hover:bg-[#7D9D6A]/5">
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
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-[#5C5C5C]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { href: '/student/tutors', icon: Search, label: 'Find a Tutor', color: 'terracotta' },
                  { href: '/student/bookings', icon: Calendar, label: 'View All Bookings', color: 'sage' },
                  { href: '/student/reviews', icon: Star, label: 'My Reviews', color: 'gold' },
                  { href: '/student/profile', icon: User, label: 'My Profile', color: 'terracotta' },
                ].map((action) => (
                  <Link key={action.href} href={action.href}>
                    <Button variant="outline" className={`w-full justify-start hover-lift border-[#C17F59]/10 hover:border-[#C17F59]/30 ${
                      action.color === 'terracotta' ? 'text-[#C17F59]' :
                      action.color === 'sage' ? 'text-[#7D9D6A]' :
                      'text-[#D4A853]'
                    }`}>
                      <action.icon className="h-4 w-4 mr-3" />
                      {action.label}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card className="border-0 bg-white/60 backdrop-blur-sm organic-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-[#5C5C5C]">Learning Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-[#5C5C5C]/70">Sessions Completed</p>
                    <p className="text-lg font-bold text-[#7D9D6A]">{stats.completed}</p>
                  </div>
                  <div className="w-full bg-[#E8E4DD] rounded-full h-2">
                    <div
                      className="bg-[#7D9D6A] h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm font-medium text-[#5C5C5C]/70">Reviews Left</p>
                    <p className="text-lg font-bold text-[#C17F59]">
                      {completedBookings.filter(b => b.review).length} / {stats.completed}
                    </p>
                  </div>
                  <div className="w-full bg-[#E8E4DD] rounded-full h-2">
                    <div
                      className="bg-[#C17F59] h-2 rounded-full transition-all duration-500"
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
    </div>
  )
}