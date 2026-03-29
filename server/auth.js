import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'
import express from 'express'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'data', 'account.json')
const JWT_SECRET = process.env.JWT_SECRET || 'monopoly-dev-secret-change-me'
const INITIAL_MONEY = 15000
const MAX_CHARACTERS_PER_USER = 20

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [], characters: [], nextId: 1, nextCharacterId: 1 }
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
  return migrateDb(db)
}

function migrateDb(db) {
  if (!Array.isArray(db.users)) db.users = []
  if (!Array.isArray(db.characters)) db.characters = []
  if (typeof db.nextId !== 'number') db.nextId = 1
  if (typeof db.nextCharacterId !== 'number') {
    const max = db.characters.reduce((m, c) => Math.max(m, c.id || 0), 0)
    db.nextCharacterId = max + 1 || 1
  }
  let changed = false
  for (const u of db.users) {
    const legacy = u.nickname !== undefined || u.money !== undefined || u.properties !== undefined
    if (legacy) {
      const hasChar = db.characters.some((c) => c.userId === u.id)
      if (!hasChar) {
        db.characters.push({
          id: db.nextCharacterId++,
          userId: u.id,
          nickname: String(u.nickname || `玩家${u.id}`).slice(0, 8),
          money: typeof u.money === 'number' ? u.money : INITIAL_MONEY,
          properties: Array.isArray(u.properties) ? [...new Set(u.properties)] : [],
          updatedAt: Date.now(),
        })
        changed = true
      }
      delete u.nickname
      delete u.money
      delete u.properties
      changed = true
    }
  }
  if (changed) writeDb(db)
  return db
}

function writeDb(db) {
  fs.mkdirSync(dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const h = pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  if (h.length !== hash.length) return false
  try {
    return timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(hash, 'hex'))
  } catch {
    return false
  }
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') throw new Error('无 token')
  const payload = jwt.verify(token, JWT_SECRET)
  return payload.sub
}

export function getUserById(id) {
  const db = readDb()
  return db.users.find((u) => u.id === id) ?? null
}

export function verifyTokenGetUser(token) {
  const id = verifyToken(token)
  const user = getUserById(id)
  if (!user) throw new Error('用户不存在')
  return user
}

export function getCharacterById(characterId) {
  const db = readDb()
  return db.characters.find((c) => c.id === characterId) ?? null
}

export function getCharactersByUserId(userId) {
  const db = readDb()
  return db.characters.filter((c) => c.userId === userId)
}

/** 校验角色属于当前用户，返回角色文档 */
export function verifyCharacterForUser(token, characterId) {
  const user = verifyTokenGetUser(token)
  if (!characterId || Number.isNaN(Number(characterId))) {
    throw new Error('请选择角色')
  }
  const cid = Number(characterId)
  const ch = getCharacterById(cid)
  if (!ch || ch.userId !== user.id) {
    throw new Error('角色无效')
  }
  return { user, character: ch }
}

export function userToPublic(user) {
  return {
    id: user.id,
    username: user.username,
  }
}

export function characterToPublic(c) {
  return {
    id: c.id,
    userId: c.userId,
    nickname: c.nickname,
    money: typeof c.money === 'number' ? c.money : INITIAL_MONEY,
    properties: Array.isArray(c.properties) ? c.properties : [],
  }
}

export function saveCharacterProgress(characterId, { money, properties }) {
  const db = readDb()
  const c = db.characters.find((x) => x.id === characterId)
  if (!c) return
  c.money = money
  c.properties = [...new Set(properties)]
  c.updatedAt = Date.now()
  writeDb(db)
}

export function loadCharacterProgress(characterId) {
  const c = getCharacterById(characterId)
  if (!c) return { money: INITIAL_MONEY, properties: [] }
  return {
    money: typeof c.money === 'number' ? c.money : INITIAL_MONEY,
    properties: Array.isArray(c.properties) ? [...new Set(c.properties)] : [],
  }
}

/** @deprecated 兼容旧 engine 引用名 */
export function saveUserProgress(id, payload) {
  saveCharacterProgress(id, payload)
}

export function loadUserProgress(id) {
  return loadCharacterProgress(id)
}

function authHeaderUserId(req) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return null
  try {
    return verifyToken(h.slice(7))
  } catch {
    return null
  }
}

export const authRouter = express.Router()

authRouter.get('/health', (_req, res) => {
  res.json({ ok: true })
})

authRouter.post('/register', (req, res) => {
  const { username, password, nickname } = req.body || {}
  const u = String(username || '').trim().toLowerCase()
  const p = String(password || '')
  const nick = String(nickname || '').trim().slice(0, 8)

  if (!/^[a-z0-9_]{3,20}$/.test(u)) {
    return res.status(400).json({ error: '用户名需 3–20 位小写字母、数字或下划线' })
  }
  if (p.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' })
  }
  if (!nick) {
    return res.status(400).json({ error: '请填写首个角色昵称' })
  }

  const db = readDb()
  if (db.users.some((x) => x.username === u)) {
    return res.status(400).json({ error: '用户名已存在' })
  }

  const id = db.nextId++
  const user = {
    id,
    username: u,
    passwordHash: hashPassword(p),
    updatedAt: Date.now(),
  }
  db.users.push(user)

  const char = {
    id: db.nextCharacterId++,
    userId: id,
    nickname: nick,
    money: INITIAL_MONEY,
    properties: [],
    updatedAt: Date.now(),
  }
  db.characters.push(char)
  writeDb(db)

  const token = signToken(id)
  res.json({
    token,
    user: userToPublic(user),
    characters: [characterToPublic(char)],
  })
})

authRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = String(username || '').trim().toLowerCase()
  const p = String(password || '')

  const db = readDb()
  const user = db.users.find((x) => x.username === u)
  if (!user || !verifyPassword(p, user.passwordHash)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const chars = db.characters
    .filter((c) => c.userId === user.id)
    .map(characterToPublic)

  const token = signToken(user.id)
  res.json({ token, user: userToPublic(user), characters: chars })
})

authRouter.get('/me', (req, res) => {
  const id = authHeaderUserId(req)
  if (!id) return res.status(401).json({ error: '未登录' })
  const user = getUserById(id)
  if (!user) return res.status(401).json({ error: '用户不存在' })
  const db = readDb()
  const characters = db.characters.filter((c) => c.userId === id).map(characterToPublic)
  res.json({ user: userToPublic(user), characters })
})

authRouter.post('/characters', (req, res) => {
  const userId = authHeaderUserId(req)
  if (!userId) return res.status(401).json({ error: '未登录' })

  const { nickname } = req.body || {}
  const nick = String(nickname || '').trim().slice(0, 8)
  if (!nick) return res.status(400).json({ error: '请填写角色昵称' })

  const db = readDb()
  const mine = db.characters.filter((c) => c.userId === userId)
  if (mine.length >= MAX_CHARACTERS_PER_USER) {
    return res.status(400).json({ error: `每个账号最多 ${MAX_CHARACTERS_PER_USER} 个角色` })
  }
  if (mine.some((c) => c.nickname === nick)) {
    return res.status(400).json({ error: '已有同名角色' })
  }

  const char = {
    id: db.nextCharacterId++,
    userId,
    nickname: nick,
    money: INITIAL_MONEY,
    properties: [],
    updatedAt: Date.now(),
  }
  db.characters.push(char)
  writeDb(db)
  res.json({ character: characterToPublic(char) })
})

authRouter.patch('/characters/:id', (req, res) => {
  const userId = authHeaderUserId(req)
  if (!userId) return res.status(401).json({ error: '未登录' })
  const cid = Number(req.params.id)
  const { nickname } = req.body || {}
  const nick = String(nickname || '').trim().slice(0, 8)
  if (!nick) return res.status(400).json({ error: '昵称不能为空' })

  const db = readDb()
  const c = db.characters.find((x) => x.id === cid && x.userId === userId)
  if (!c) return res.status(404).json({ error: '角色不存在' })
  if (db.characters.some((x) => x.userId === userId && x.id !== cid && x.nickname === nick)) {
    return res.status(400).json({ error: '已有同名角色' })
  }
  c.nickname = nick
  c.updatedAt = Date.now()
  writeDb(db)
  res.json({ character: characterToPublic(c) })
})

authRouter.delete('/characters/:id', (req, res) => {
  const userId = authHeaderUserId(req)
  if (!userId) return res.status(401).json({ error: '未登录' })
  const cid = Number(req.params.id)

  const db = readDb()
  const mine = db.characters.filter((c) => c.userId === userId)
  if (mine.length <= 1) {
    return res.status(400).json({ error: '至少保留一个角色' })
  }
  const idx = db.characters.findIndex((x) => x.id === cid && x.userId === userId)
  if (idx < 0) return res.status(404).json({ error: '角色不存在' })
  db.characters.splice(idx, 1)
  writeDb(db)
  res.json({ ok: true })
})
