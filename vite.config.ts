import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const wsPort = env.VITE_DEV_WS_PORT || '8080'
  return {
    plugins: [vue()],
    server: {
      port: 3000,
      proxy: {
        '/ws': {
          target: `ws://127.0.0.1:${wsPort}`,
          ws: true,
        },
      },
    },
  }
})
