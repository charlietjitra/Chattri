'use client'

import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react'
import useReactWebSocket, { ReadyState } from 'react-use-websocket'
import { getAuthToken } from '@/lib/api-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8888/ws'

interface WebSocketMessage {
  type: string
  payload?: any
}

interface WebSocketContextType {
  sendMessage: (message: WebSocketMessage) => void
  lastMessage: WebSocketMessage | null
  readyState: ReadyState
  isConnected: boolean
  joinSession: (sessionId: string) => void
  leaveSession: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const token = getAuthToken()

  const { sendMessage: rawSendMessage, lastMessage, readyState } = useReactWebSocket(WS_URL, {
    queryParams: token ? { token } : {},
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    share: true,
  })

  const isConnected = readyState === ReadyState.OPEN

  const sendMessage = useCallback((message: WebSocketMessage) => {
    rawSendMessage(JSON.stringify(message))
  }, [rawSendMessage])

  const joinSession = useCallback((sessionId: string) => {
    rawSendMessage(JSON.stringify({ type: 'join_session', sessionId }))
  }, [rawSendMessage])

  const leaveSession = useCallback(() => {
    rawSendMessage(JSON.stringify({ type: 'leave_session' }))
  }, [rawSendMessage])

  const parsedLastMessage = useMemo(() => {
    if (!lastMessage?.data) return null
    try {
      return JSON.parse(lastMessage.data) as WebSocketMessage
    } catch {
      return null
    }
  }, [lastMessage])

  const value = useMemo(() => ({
    sendMessage,
    lastMessage: parsedLastMessage,
    readyState,
    isConnected,
    joinSession,
    leaveSession,
  }), [sendMessage, parsedLastMessage, readyState, isConnected, joinSession, leaveSession])

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export function useSessionWebSocket(sessionId: string | null) {
  const { lastMessage, isConnected, joinSession, leaveSession } = useWebSocket()

  const messages = useMemo(() => {
    if (!lastMessage || lastMessage.type !== 'new_message') return null
    return lastMessage.payload
  }, [lastMessage])

  return {
    messages,
    isConnected,
    joinSession,
    leaveSession,
    sessionId,
  }
}