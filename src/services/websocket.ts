import { ref } from 'vue'

type MessageHandler = (data: any) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers = new Map<string, MessageHandler[]>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private url = ''
  private pendingMessages: Record<string, any>[] = []
  private _onceHandlers = new Map<string, MessageHandler[]>()

  connected = ref(false)

  connect(url: string) {
    this.url = url
    this.disconnect()
    this._onceHandlers.clear()
    this.pendingMessages = []
    console.log(`%c[WS] 正在连接 ${url}...`, 'color:#888')
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.connected.value = true
      console.log(
        `%c[WS] 连接成功 %c${url} %c(已缓存 ${this.pendingMessages.length} 条消息待发送)`,
        'color:#2ecc71;font-weight:bold',
        'color:#3498db',
        'color:#888'
      )
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      while (this.pendingMessages.length > 0) {
        const msg = this.pendingMessages.shift()!
        console.log(`%c[WS] >>> ${msg.type}`, 'color:#27ae60', msg)
        this.ws!.send(JSON.stringify(msg))
      }
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log(`%c[WS] <<< ${data.type}`, 'color:#8e44ad', data)
        const type = data.type
        const handlers = this.handlers.get(type) || []
        handlers.forEach(h => h(data))
        const once = this._onceHandlers.get(type) || []
        this._onceHandlers.set(type, [])
        once.forEach(h => h(data))
        const wildcards = this.handlers.get('*') || []
        wildcards.forEach(h => h(data))
      } catch (e) {
        console.error('[WS] Failed to parse message', e)
      }
    }

    this.ws.onclose = () => {
      this.connected.value = false
      console.log('%c[WS] 连接已断开', 'color:#e74c3c;font-weight:bold')
      this.tryReconnect()
    }

    this.ws.onerror = () => {
      console.error(
        `%c[WS] 连接失败 %c${url} — 请确保已启动服务端: node server/index.js`,
        'color:#e74c3c;font-weight:bold',
        'color:#e67e22'
      )
    }
  }

  private tryReconnect() {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      console.log('Reconnecting...')
      this.reconnectTimer = null
      this.connect(this.url)
    }, 3000)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.close()
      this.ws = null
    }
    this.connected.value = false
    this.pendingMessages = []
  }

  send(data: Record<string, any>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      // Queue message until connection opens
      this.pendingMessages.push(data)
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type)!.push(handler)
  }

  once(type: string, handler: MessageHandler) {
    if (!this._onceHandlers.has(type)) {
      this._onceHandlers.set(type, [])
    }
    this._onceHandlers.get(type)!.push(handler)
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx >= 0) handlers.splice(idx, 1)
    }
  }
}

export const wsService = new WebSocketService()
