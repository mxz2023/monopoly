import { createServer } from 'http'
import express from 'express'
import { WebSocketServer } from 'ws'
import { routeMessage, handleConnectionClose } from './engine.js'
import { authRouter } from './auth.js'

const PORT =
  Number(process.argv[2]) || Number(process.env.PORT) || 8080

const app = express()

app.use((req, res, next) => {
  const o = req.headers.origin
  if (o && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(o)) {
    res.setHeader('Access-Control-Allow-Origin', o)
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})

app.use(express.json())
app.use('/api', authRouter)

const server = createServer(app)

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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[错误] 端口 ${PORT} 已被占用（常见原因：已有一个 node server 在跑）。\n` +
        `  • 结束旧进程：lsof -i :${PORT}  然后  kill <PID>\n` +
        `  • 或换端口：PORT=9000 npm run server   或   npm run server -- 9000\n` +
        `  • 若改了端口，前端 .env 里 VITE_DEV_WS_PORT 需与之一致。\n`
    )
  } else {
    console.error(err)
  }
  process.exit(1)
})

server.listen(PORT, () => {
  console.log(`HTTP + WebSocket on http://127.0.0.1:${PORT}  (API /api  WS /ws)`)
})
