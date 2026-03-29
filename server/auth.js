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

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    return { users: [], nextId: 1 }
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
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

export function userToPublic(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    money: typeof user.money === 'number' ? user.money : INITIAL_MONEY,
    properties: Array.isArray(user.properties) ? user.properties : [],
  }
}

export function saveUserProgress(userId, { money, properties }) {
  const db = readDb()
  const u = db.users.find((x) => x.id === userId)
  if (!u) return
  u.money = money
  u.properties = [...new Set(properties)]
  u.updatedAt = Date.now()
  writeDb(db)
}

export function loadUserProgress(userId) {
  const u = getUserById(userId)
  if (!u) return { money: INITIAL_MONEY, properties: [] }
  return {
    money: typeof u.money === 'number' ? u.money : INITIAL_MONEY,
    properties: Array.isArray(u.properties) ? [...new Set(u.properties)] : [],
  }
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

/** 供前端检测后端是否已启动（不走复杂中间件） */
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
    return res.status(400).json({ error: '请填写昵称' })
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
    nickname: nick,
    money: INITIAL_MONEY,
    properties: [],
    updatedAt: Date.now(),
  }
  db.users.push(user)
  writeDb(db)

  const token = signToken(id)
  res.json({ token, user: userToPublic(user) })
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

  const token = signToken(user.id)
  res.json({ token, user: userToPublic(user) })
})

authRouter.get('/me', (req, res) => {
  const id = authHeaderUserId(req)
  if (!id) return res.status(401).json({ error: '未登录' })
  const user = getUserById(id)
  if (!user) return res.status(401).json({ error: '用户不存在' })
  res.json({ user: userToPublic(user) })
})

authRouter.patch('/me', (req, res) => {
  const id = authHeaderUserId(req)
  if (!id) return res.status(401).json({ error: '未登录' })
  const { nickname } = req.body || {}
  const nick = String(nickname || '').trim().slice(0, 8)
  if (!nick) return res.status(400).json({ error: '昵称不能为空' })

  const db = readDb()
  const user = db.users.find((x) => x.id === id)
  if (!user) return res.status(404).json({ error: '用户不存在' })
  user.nickname = nick
  user.updatedAt = Date.now()
  writeDb(db)
  res.json({ user: userToPublic(user) })
})
