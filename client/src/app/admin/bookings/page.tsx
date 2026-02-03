'use client'

import { useState, useEffect } from 'react'
import { adminApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  BookOpen, 
  Search, 
  Edit, 
  Trash2, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react'

interface Booking {
  id: string
  studentId: string
  tutorId: string
  scheduledStartTime: string
  scheduledEndTime: string
  status: string
  cancellationReason?: string
  createdAt: string
  updatedAt: string
  student?: {
    firstName: string
    lastName: string
    email: string
  }
  tutor?: {
    firstName: string
    lastName: string
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [pagination.page, statusFilter])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getBookings(
        pagination.page, 
        pagination.limit, 
        statusFilter === 'all' ? undefined : statusFilter
      )
      setBookings(data.bookings)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditBooking = async (bookingData: Partial<Booking>) => {
    if (!editingBooking) return

    try {
      await adminApi.updateBooking(editingBooking.id, bookingData)
      setIsEditDialogOpen(false)
      setEditingBooking(null)
      loadBookings()
    } catch (error) {
      console.error('Failed to update booking:', error)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await adminApi.deleteBooking(bookingId)
      loadBookings()
    } catch (error) {
      console.error('Failed to delete booking:', error)
    }
  }

  const filteredBookings = bookings.filter(booking => 
    booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.student?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.student?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.tutor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.tutor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
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
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600 mt-2">Manage all platform bookings</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Bookings ({pagination.total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search bookings..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookings Table */}
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tutor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{booking.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(booking.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.student?.firstName} {booking.student?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{booking.student?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.tutor?.firstName} {booking.tutor?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{booking.tutor?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.scheduledStartTime)}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {formatDate(booking.scheduledEndTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        {booking.cancellationReason && (
                          <div className="text-xs text-gray-500 mt-1">
                            {booking.cancellationReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingBooking(booking)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete booking #${booking.id}? This action cannot be undone.`)) {
                                handleDeleteBooking(booking.id)
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
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
        </CardContent>
      </Card>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>
              Update booking information and status
            </DialogDescription>
          </DialogHeader>
          {editingBooking && (
            <EditBookingForm 
              booking={editingBooking} 
              onSave={handleEditBooking}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface EditBookingFormProps {
  booking: Booking
  onSave: (bookingData: Partial<Booking>) => void
  onCancel: () => void
}

function EditBookingForm({ booking, onSave, onCancel }: EditBookingFormProps) {
  const [formData, setFormData] = useState({
    status: booking.status,
    scheduledStartTime: booking.scheduledStartTime,
    scheduledEndTime: booking.scheduledEndTime,
    cancellationReason: booking.cancellationReason || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduledStartTime">Start Time</Label>
          <Input
            id="scheduledStartTime"
            type="datetime-local"
            value={new Date(formData.scheduledStartTime).toISOString().slice(0, 16)}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduledStartTime: new Date(e.target.value).toISOString() }))}
          />
        </div>
        <div>
          <Label htmlFor="scheduledEndTime">End Time</Label>
          <Input
            id="scheduledEndTime"
            type="datetime-local"
            value={new Date(formData.scheduledEndTime).toISOString().slice(0, 16)}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduledEndTime: new Date(e.target.value).toISOString() }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cancellationReason">Cancellation Reason (if applicable)</Label>
        <Input
          id="cancellationReason"
          value={formData.cancellationReason}
          onChange={(e) => setFormData(prev => ({ ...prev, cancellationReason: e.target.value }))}
          placeholder="Enter reason for cancellation..."
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}