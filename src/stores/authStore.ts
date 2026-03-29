import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiUrl } from '../config/api'

const CHARACTER_KEY = 'monopoly_character_id'

export interface AuthUser {
  id: number
  username: string
}

export interface AuthCharacter {
  id: number
  userId: number
  nickname: string
  money: number
  properties: number[]
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('monopoly_token') || '')
  const user = ref<AuthUser | null>(null)
  const characters = ref<AuthCharacter[]>([])
  const selectedCharacterId = ref<number>(
    Number(localStorage.getItem(CHARACTER_KEY)) || 0
  )

  const selectedCharacter = computed(() =>
    characters.value.find((c) => c.id === selectedCharacterId.value) ?? null
  )

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function pickDefaultCharacterId(list: AuthCharacter[]): number {
    const saved = Number(localStorage.getItem(CHARACTER_KEY))
    if (saved && list.some((c) => c.id === saved)) return saved
    return list[0]?.id ?? 0
  }

  function setSession(t: string, u: AuthUser, chars: AuthCharacter[]) {
    token.value = t
    localStorage.setItem('monopoly_token', t)
    user.value = u
    characters.value = chars
    const sid = pickDefaultCharacterId(chars)
    selectedCharacterId.value = sid
    if (sid) localStorage.setItem(CHARACTER_KEY, String(sid))
  }

  function setSelectedCharacterId(id: number) {
    if (!characters.value.some((c) => c.id === id)) return
    selectedCharacterId.value = id
    localStorage.setItem(CHARACTER_KEY, String(id))
  }

  async function fetchMe() {
    if (!token.value) {
      user.value = null
      characters.value = []
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
        characters.value = []
        return
      }
      const data = await res.json()
      user.value = data.user ?? null
      characters.value = data.characters ?? []
      const sid = pickDefaultCharacterId(characters.value)
      selectedCharacterId.value = sid
      if (sid) localStorage.setItem(CHARACTER_KEY, String(sid))
    } catch {
      token.value = ''
      localStorage.removeItem('monopoly_token')
      user.value = null
      characters.value = []
    }
  }

  function logout() {
    token.value = ''
    localStorage.removeItem('monopoly_token')
    localStorage.removeItem(CHARACTER_KEY)
    user.value = null
    characters.value = []
    selectedCharacterId.value = 0
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
      setSession(data.token, data.user, data.characters ?? [])
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
    setSession(data.token, data.user, data.characters ?? [])
  }

  async function createCharacter(nickname: string) {
    const res = await fetch(apiUrl('/api/characters'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ nickname }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || '创建失败')
    characters.value = [...characters.value, data.character]
    setSelectedCharacterId(data.character.id)
    return data.character as AuthCharacter
  }

  async function updateCharacterNickname(characterId: number, nickname: string) {
    const res = await fetch(apiUrl(`/api/characters/${characterId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ nickname }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || '更新失败')
    const idx = characters.value.findIndex((c) => c.id === characterId)
    if (idx >= 0) characters.value[idx] = data.character
  }

  async function deleteCharacter(characterId: number) {
    const res = await fetch(apiUrl(`/api/characters/${characterId}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` },
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || '删除失败')
    characters.value = characters.value.filter((c) => c.id !== characterId)
    if (selectedCharacterId.value === characterId) {
      const sid = characters.value[0]?.id ?? 0
      selectedCharacterId.value = sid
      if (sid) localStorage.setItem(CHARACTER_KEY, String(sid))
      else localStorage.removeItem(CHARACTER_KEY)
    }
  }

  return {
    token,
    user,
    characters,
    selectedCharacterId,
    selectedCharacter,
    isAuthenticated,
    fetchMe,
    login,
    register,
    logout,
    setSession,
    setSelectedCharacterId,
    createCharacter,
    updateCharacterNickname,
    deleteCharacter,
  }
})
