'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calendar, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface Session {
  id: string
  bookingId: string
  actualStartTime?: string
  actualEndTime?: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  booking: {
    id: string
    studentId: string
    tutorId: string
    scheduledStartTime: string
    scheduledEndTime: string
    status: string
    student?: {
      firstName: string
      lastName: string
    }
    tutor?: {
      firstName: string
      lastName: string
    }
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function SessionsManagement() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadSessions()
  }, [pagination.page, statusFilter])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getSessions(
        pagination.page, 
        pagination.limit, 
        statusFilter === 'all' ? undefined : statusFilter
      )
      setSessions(data.sessions)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => 
    session.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.booking.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.booking.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.booking.tutor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.booking.tutor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'no_show': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'no_show': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 'N/A'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))
    
    if (durationMinutes < 60) {
      return `${durationMinutes}m`
    } else {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      return `${hours}h ${minutes}m`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sessions Management</h1>
        <p className="text-gray-600 mt-2">Monitor all tutoring sessions</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Sessions ({pagination.total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions</h3>
                <p className="mt-1 text-sm text-gray-500">No sessions found matching your criteria.</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <Card key={session.id} className="border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">Session #{session.id}</Badge>
                            <Badge variant="outline">Booking #{session.bookingId}</Badge>
                            <Badge className={getStatusColor(session.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(session.status)}
                                <span>{session.status}</span>
                              </div>
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            Created {formatDate(session.createdAt)}
                          </div>
                        </div>

                        {/* Participants */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Student</div>
                            <div className="text-sm text-gray-600">
                              {session.booking.student?.firstName} {session.booking.student?.lastName}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Tutor</div>
                            <div className="text-sm text-gray-600">
                              {session.booking.tutor?.firstName} {session.booking.tutor?.lastName}
                            </div>
                          </div>
                        </div>

                        {/* Time Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Scheduled</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(session.booking.scheduledStartTime)}
                            </div>
                            <div className="text-sm text-gray-600">
                              to {formatDate(session.booking.scheduledEndTime)}
                            </div>
                          </div>
                          
                          {session.actualStartTime && (
                            <div>
                              <div className="text-sm font-medium text-gray-900">Actual Start</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(session.actualStartTime)}
                              </div>
                            </div>
                          )}
                          
                          {session.actualEndTime && (
                            <div>
                              <div className="text-sm font-medium text-gray-900">Actual End</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(session.actualEndTime)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Duration: {getDuration(session.actualStartTime, session.actualEndTime)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {session.notes && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-900 mb-2">Notes</div>
                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                              {session.notes}
                            </div>
                          </div>
                        )}

                        {/* Booking Status */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Booking Status:</span>
                          <Badge variant="outline">{session.booking.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} sessions
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}