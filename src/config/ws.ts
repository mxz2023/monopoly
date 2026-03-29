/**
 * WebSocket 地址：生产环境需与前端同域反向代理 /ws，或通过 VITE_WS_URL 指定完整地址。
 */
export function getWebSocketUrl(): string {
  const fromEnv = import.meta.env.VITE_WS_URL as string | undefined
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).trim()
  }
  if (import.meta.env.DEV) {
    const port = import.meta.env.VITE_DEV_WS_PORT ?? '8080'
    return `ws://127.0.0.1:${port}/ws`
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/ws`
}
