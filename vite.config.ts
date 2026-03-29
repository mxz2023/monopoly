import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import express from 'express'
import { authRouter } from './server/auth.js'

/** 在 Vite 进程内挂载 /api，避免仅开 dev 时代理到 8080 失败（404/502） */
function monopolyApiMiddleware() {
  const mount = () => {
    const apiApp = express()
    apiApp.use(express.json())
    apiApp.use(authRouter)
    return apiApp
  }
  return {
    name: 'monopoly-api',
    configureServer(server) {
      server.middlewares.use('/api', mount())
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api', mount())
    },
  }
}

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
    plugins: [vue(), monopolyApiMiddleware()],
    server: {
      port: 3000,
      proxy: {
        '/ws': {
          target: `ws://127.0.0.1:${wsPort}`,
          ws: true,
        },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/ws': {
          target: `ws://127.0.0.1:${wsPort}`,
          ws: true,
        },
      },
    },
  }
})
