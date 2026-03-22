export interface Player {
  id: number
  name: string
  avatar: string
  money: number
  position: number
  properties: number[]
  status: 'active' | 'bankrupt' | 'jail'
  jailTurns: number
  inJail: boolean
  isReady: boolean
  isConnected: boolean
}

export interface Property {
  id: number
  name: string
  type: 'property' | 'railroad' | 'utility' | 'chance' | 'chest' | 'tax' | 'corner'
  price: number
  rent: number[]
  ownerId: number | null
  mortgage: boolean
  houses: number
  hotel: boolean
  color: string
  group: number
  description: string
}

export interface Card {
  id: number
  type: 'chance' | 'chest'
  title: string
  description: string
  action: string
  value: number
}

export interface GameState {
  roomId: string
  status: 'waiting' | 'playing' | 'finished'
  players: Player[]
  properties: Property[]
  turn: number
  currentPlayerIndex: number
  phase: 'roll' | 'moving' | 'action' | 'trade'
  dice: [number, number]
  doubleCount: number
  logs: LogEntry[]
  winner: number | null
}

export interface LogEntry {
  time: string
  message: string
  type: 'info' | 'buy' | 'rent' | 'pay' | 'card' | 'jail' | 'bankrupt'
}

export interface WSMessage {
  type: string
  [key: string]: any
}

export const PLAYER_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
]

export const AVATARS = ['🤵', '👩', '🧑', '👴', '👸', '🦸', '🧙', '🤠', '👻', '🦊', '🐉', '🐼']
