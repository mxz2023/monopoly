import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { routeMessage, handleConnectionClose } from './engine.js'

const PORT = Number(process.env.PORT) || 8080

const server = createServer()
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  console.log('New connection')

  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }))
      return
    }
    routeMessage(ws, msg)
  })

  ws.on('close', () => {
    handleConnectionClose(ws)
  })
})

server.listen(PORT, () => {
  console.log(`Monopoly WebSocket server running on ws://localhost:${PORT}/ws`)
})
