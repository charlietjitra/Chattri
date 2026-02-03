'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { sessionsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  MessageCircle, 
  Send, 
  Clock, 
  Users, 
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface SessionAccess {
  accessStatus: string
  accessMessage: string
  canMessage: boolean
  canStart: boolean
  session: {
    id: string
    status: string
    scheduledStart: string
    scheduledEnd: string
    actualStartTime?: string
    actualEndTime?: string
    tutorName?: string
    bookingId?: string
    tutorId?: string
  }
  sessionId: string
}

interface SessionMessage {
  id: string
  messageContent: string
  sentAt: string
  sender: {
    id: string
    firstName: string
    lastName: string
    avatarUrl?: string
    isMe: boolean
  }
}

function StudentSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // URL params
  const bookingId = searchParams.get('booking')
  const sessionId = searchParams.get('session')

  // State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId)
  const [sessionAccess, setSessionAccess] = useState<SessionAccess | null>(null)
  const [messages, setMessages] = useState<SessionMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!user || user.role !== 'student') {
      router.push('/login')
      return
    }

    if (!bookingId && !sessionId) {
      router.push('/student/bookings')
      return
    }

    loadSessionData()
  }, [bookingId, sessionId, user, router])

  // Set up auto-refresh for messages
  useEffect(() => {
    if (currentSessionId && sessionAccess?.canMessage) {
      // Refresh messages every 3 seconds
      refreshIntervalRef.current = setInterval(() => {
        loadMessages()
      }, 30000)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [currentSessionId, sessionAccess?.canMessage])

  const loadSessionData = async () => {
    try {
      setLoading(true)
      let resolvedSessionId = sessionId

      // If we have booking ID but no session ID, get session by booking
      if (bookingId && !resolvedSessionId) {
        const sessionData = await sessionsApi.getSessionByBooking(bookingId)
        resolvedSessionId = sessionData.session.id
      }

      if (!resolvedSessionId) {
        setError('Session not found')
        return
      }

      // Set the session ID only if it's different
      if (currentSessionId !== resolvedSessionId) {
        setCurrentSessionId(resolvedSessionId)
      }

      // Check session access
      const accessData = await sessionsApi.checkSessionAccess(resolvedSessionId)
      console.log('Session access data:', accessData)
      setSessionAccess(accessData)

      // Load messages if we can message
      if (accessData.canMessage) {
        await loadMessages(resolvedSessionId)
      }

      setError('')
    } catch (error: any) {
      console.error('Failed to load session:', error)
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.')
      } else {
        setError(error.response?.data?.error || 'Failed to load session')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (sessionId?: string) => {
    try {
      const targetSessionId = sessionId || currentSessionId
      if (!targetSessionId) return

      const messagesData = await sessionsApi.getMessages(targetSessionId)
      setMessages(messagesData.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentSessionId || sending) return

    try {
      setSending(true)
      
      // Send message via HTTP
      await sessionsApi.sendMessage(currentSessionId, newMessage.trim())
      setNewMessage('')
      
      // Reload messages to show the new message
      await loadMessages()
    } catch (error: any) {
      console.error('Failed to send message:', error)
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleRefresh = () => {
    loadSessionData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'no_show': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccessStatusColor = (status?: string) => {
    if (!status) return 'gray'
    switch (status) {
      case 'pre_session': return 'blue'
      case 'during_session': return 'green'
      case 'post_session': return 'yellow'
      case 'too_early': return 'gray'
      case 'expired': return 'red'
      default: return 'gray'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.push('/student/bookings')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bookings
          </Button>
          <h1 className="text-2xl font-bold">Session</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Session Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Session Details
              
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionAccess && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Tutor</p>
                  <p className="text-sm text-gray-600">
                     {sessionAccess.session.tutorName || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Scheduled Time</p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(sessionAccess.session.scheduledStart)} - {formatTime(sessionAccess.session.scheduledEnd)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Messaging</p>
                  <p className="text-sm text-gray-600">
                    {sessionAccess.canMessage ? 'Available' : 'Not available'}
                  </p>
                </div>
              </div>
              {/* Review CTA removed temporarily */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messaging Section */}
      {sessionAccess?.canMessage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Session Chat
            </CardTitle>
            <CardDescription>
              Chat with your tutor during the session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Messages Display */}
            <div className="h-96 overflow-y-auto mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender.isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${message.sender.isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender.avatarUrl || undefined} />
                          <AvatarFallback>
                            {message.sender.firstName?.[0]}{message.sender.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`rounded-lg p-3 ${
                          message.sender.isMe 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white border'
                        }`}>
                          <p className="text-sm">{message.messageContent}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender.isMe ? 'text-purple-200' : 'text-gray-500'
                          }`}>
                            {formatTime(message.sentAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                {sending ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* No Access Message */}
      {sessionAccess && !sessionAccess.canMessage && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Session chat not available
            </h3>
            <p className="text-gray-600">
              You can only access the session chat 1 hour before, during, and 1 hour after your scheduled session.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function StudentSessionPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    }>
      <StudentSessionContent />
    </Suspense>
  )
}