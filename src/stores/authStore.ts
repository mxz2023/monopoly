import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiUrl } from '../config/api'

export interface AuthUser {
  id: number
  username: string
  nickname: string
  money: number
  properties: number[]
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('monopoly_token') || '')
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function setSession(t: string, u: AuthUser) {
    token.value = t
    localStorage.setItem('monopoly_token', t)
    user.value = u
  }

  async function fetchMe() {
    if (!token.value) {
      user.value = null
      return
    }
    try {
      const res = await fetch(apiUrl('/api/me'), {
        headers: { Authorization: `Bearer ${token.value}` },
      })
      if (!res.ok) {
        token.value = ''
        localStorage.removeItem('monopoly_token')
        user.value = null
        return
      }
      const data = await res.json()
      user.value = data.user ?? null
    } catch {
      token.value = ''
      localStorage.removeItem('monopoly_token')
      user.value = null
    }
  }

  function logout() {
    token.value = ''
    localStorage.removeItem('monopoly_token')
    user.value = null
  }

  async function login(username: string, password: string) {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 20000)
    try {
      const res = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: ac.signal,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '登录失败')
      setSession(data.token, data.user)
    } catch (e: unknown) {
      const name = e instanceof Error ? e.name : ''
      if (name === 'AbortError') {
        throw new Error('无法连接服务器：请先在终端运行 npm run server（默认端口 8080），再刷新页面重试')
      }
      throw e
    } finally {
      clearTimeout(t)
    }
  }

  async function register(username: string, password: string, nickname: string) {
    const res = await fetch(apiUrl('/api/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, nickname }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || '注册失败')
    setSession(data.token, data.user)
  }

  async function updateNickname(nickname: string) {
    const res = await fetch(apiUrl('/api/me'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ nickname }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || '更新失败')
    user.value = data.user
  }

  return {
    token,
    user,
    isAuthenticated,
    fetchMe,
    login,
    register,
    logout,
    updateNickname,
    setSession,
  }
})
