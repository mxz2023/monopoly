<template>
  <div class="auth-view">
    <div class="auth-bg">
      <div class="auth-card">
        <h1 class="title">登录</h1>
        <p class="subtitle">登录后可创建/加入房间，资产与产业会保存在账户中</p>

        <div v-if="backendOk === false" class="backend-warning">
          <strong>无法连接游戏服务</strong>
          <p>请在本机<strong>另开一个终端</strong>运行 <code>npm run server</code>（监听 8080），再点下方「重试检测」或刷新页面。</p>
          <p class="hint">若仍卡住，请尝试无痕窗口或暂时关闭广告拦截扩展（localhost 请求有时会被拦截）。</p>
          <button type="button" class="btn-retry" @click="checkBackend">重试检测</button>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <div class="input-group">
          <label>用户名</label>
          <input v-model="username" class="input" type="text" autocomplete="username" placeholder="3–20 位小写字母、数字或下划线" @keyup.enter="submit" />
        </div>
        <div class="input-group">
          <label>密码</label>
          <input v-model="password" class="input" type="password" autocomplete="current-password" placeholder="至少 6 位" @keyup.enter="submit" />
        </div>

        <button class="btn btn-primary" :disabled="loading" @click="submit">
          {{ loading ? '登录中…' : '登录' }}
        </button>
        <p class="footer-link">
          没有账号？
          <router-link to="/register">注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { apiUrl } from '../config/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
/** null = 未检测，true / false = 已检测 */
const backendOk = ref<boolean | null>(null)

async function checkBackend() {
  const ac = new AbortController()
  const tid = window.setTimeout(() => ac.abort(), 5000)
  try {
    const r = await fetch(apiUrl('/api/health'), { signal: ac.signal, cache: 'no-store' })
    backendOk.value = r.ok
  } catch {
    backendOk.value = false
  } finally {
    window.clearTimeout(tid)
  }
}

onMounted(() => {
  checkBackend()
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value.trim().toLowerCase(), password.value)
    const q = route.query.redirect
    const redirect =
      typeof q === 'string' ? q : Array.isArray(q) && q[0] ? q[0] : '/'
    router.replace(redirect || '/')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  width: 100vw;
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.auth-bg {
  width: 100%;
  max-width: 420px;
}
.auth-card {
  background: rgba(20, 20, 45, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 16px;
  padding: 32px;
}
.title {
  color: #ffd700;
  font-size: 28px;
  margin: 0 0 8px;
  text-align: center;
}
.subtitle {
  color: #888;
  font-size: 13px;
  text-align: center;
  margin: 0 0 24px;
  line-height: 1.5;
}
.error-msg {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}
.input-group {
  margin-bottom: 16px;
}
.input-group label {
  display: block;
  color: #aaa;
  font-size: 12px;
  margin-bottom: 6px;
}
.input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.35);
  color: #eee;
  font-size: 15px;
}
.input:focus {
  outline: none;
  border-color: rgba(255, 215, 0, 0.5);
}
.btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
.btn-primary {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: #fff;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.footer-link {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-top: 20px;
}
.footer-link a {
  color: #3498db;
  text-decoration: none;
}
.footer-link a:hover {
  text-decoration: underline;
}

.backend-warning {
  background: rgba(231, 76, 60, 0.15);
  border: 1px solid rgba(231, 76, 60, 0.45);
  color: #f5b7b1;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 16px;
  text-align: left;
}
.backend-warning strong {
  color: #e74c3c;
  display: block;
  margin-bottom: 8px;
}
.backend-warning code {
  background: rgba(0, 0, 0, 0.35);
  padding: 2px 8px;
  border-radius: 4px;
  color: #ffd700;
  font-size: 12px;
}
.backend-warning .hint {
  color: #aaa;
  font-size: 12px;
  margin-top: 8px;
}
.btn-retry {
  margin-top: 10px;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: #eee;
  cursor: pointer;
  font-size: 13px;
}
.btn-retry:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
