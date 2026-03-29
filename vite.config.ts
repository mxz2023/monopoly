import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  let wsPort = env.VITE_DEV_WS_PORT || '8080'
  if (wsPort === '3000') {
    console.warn(
      '[monopoly] VITE_DEV_WS_PORT=3000 会与 Vite 端口冲突，已改用 8080。请修改 .env 或删除该变量。'
    )
    wsPort = '8080'
  }
  return {
    plugins: [vue()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${wsPort}`,
          changeOrigin: true,
          secure: false,
          ws: false,
          timeout: 20000,
          proxyTimeout: 20000,
        },
        '/ws': {
          target: `ws://127.0.0.1:${wsPort}`,
          ws: true,
        },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${wsPort}`,
          changeOrigin: true,
          secure: false,
          ws: false,
          timeout: 20000,
          proxyTimeout: 20000,
        },
        '/ws': {
          target: `ws://127.0.0.1:${wsPort}`,
          ws: true,
        },
      },
    },
  }
})
