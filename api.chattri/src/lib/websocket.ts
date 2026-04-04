import { WebSocketServer, WebSocket } from 'ws'
import { verifyToken, type JWTPayload } from '../utils/auth.js'
import { db } from '../lib/db.js'

interface AuthenticatedWebSocket extends WebSocket {
  user?: JWTPayload
  sessionId?: string
  isAlive?: boolean
}

interface ClientMessage {
  type: string
  sessionId?: string
  content?: string
}

interface ServerMessage {
  type: string
  payload?: any
}

const PORT = 8891
const HEARTBEAT_INTERVAL = 30000
const PING_INTERVAL = 15000

const wss = new WebSocketServer({ port: PORT })

const sessionRooms = new Map<string, Set<AuthenticatedWebSocket>>()

function authenticateClient(token: string): JWTPayload | null {
  try {
    return verifyToken(token)
  } catch (error) {
    console.error('WebSocket authentication failed:', error)
    return null
  }
}

function joinSessionRoom(sessionId: string, client: AuthenticatedWebSocket) {
  if (!sessionRooms.has(sessionId)) {
    sessionRooms.set(sessionId, new Set())
  }
  sessionRooms.get(sessionId)!.add(client)
  client.sessionId = sessionId
  console.log(`Client joined session room: ${sessionId}`)
}

function leaveSessionRoom(client: AuthenticatedWebSocket) {
  if (client.sessionId && sessionRooms.has(client.sessionId)) {
    const room = sessionRooms.get(client.sessionId)!
    room.delete(client)
    if (room.size === 0) {
      sessionRooms.delete(client.sessionId)
    }
    console.log(`Client left session room: ${client.sessionId}`)
  }
}

function broadcastToSession(sessionId: string, message: ServerMessage, excludeClient?: AuthenticatedWebSocket) {
  const room = sessionRooms.get(sessionId)
  if (!room) return

  const messageStr = JSON.stringify(message)
  room.forEach((client) => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr)
    }
  })
}

function handleMessage(client: AuthenticatedWebSocket, data: string) {
  try {
    const message: ClientMessage = JSON.parse(data)

    switch (message.type) {
      case 'join_session':
        if (message.sessionId) {
          joinSessionRoom(message.sessionId, client)
          client.send(JSON.stringify({
            type: 'joined_session',
            payload: { sessionId: message.sessionId }
          }))
        }
        break

      case 'leave_session':
        leaveSessionRoom(client)
        client.send(JSON.stringify({
          type: 'left_session',
          payload: {}
        }))
        break

      case 'ping':
        client.send(JSON.stringify({ type: 'pong' }))
        break

      default:
        console.log('Unknown message type:', message.type)
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error)
  }
}

async function broadcastNewMessage(sessionId: string, message: any) {
  const room = sessionRooms.get(sessionId)
  if (!room) return

  const messageWithSender = {
    type: 'new_message',
    payload: message
  }

  const messageStr = JSON.stringify(messageWithSender)
  room.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr)
    }
  })
}

wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const token = url.searchParams.get('token')

  if (!token) {
    ws.close(4001, 'Authentication required')
    return
  }

  const user = authenticateClient(token)
  if (!user) {
    ws.close(4002, 'Invalid token')
    return
  }

  ws.user = user
  ws.isAlive = true
  console.log(`WebSocket client connected: ${user.userId} (${user.role})`)

  ws.on('message', (data) => {
    handleMessage(ws, data.toString())
  })

  ws.on('close', () => {
    console.log(`WebSocket client disconnected: ${ws.user?.userId}`)
    leaveSessionRoom(ws)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  ws.on('pong', () => {
    ws.isAlive = true
  })
})

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws: AuthenticatedWebSocket) => {
    if (ws.isAlive === false) {
      leaveSessionRoom(ws)
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping()
  })
}, HEARTBEAT_INTERVAL)

wss.on('close', () => {
  clearInterval(heartbeatInterval)
})

console.log(`WebSocket server running on ws://localhost:${PORT}`)

export { broadcastNewMessage, wss }