import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Property, GameState, LogEntry } from '../types'

export const useGameStore = defineStore('game', () => {
  const roomId = ref('')
  const hostId = ref(0)
  const playerId = ref(0)
  const players = ref<Player[]>([])
  const properties = ref<Property[]>([])
  const turn = ref(1)
  const currentPlayerIndex = ref(0)
  const phase = ref('waiting')
  const dice = ref<[number, number]>([0, 0])
  const doubleCount = ref(0)
  const logs = ref<LogEntry[]>([])
  const winner = ref<number | null>(null)
  const status = ref<'waiting' | 'playing' | 'finished'>('waiting')

  const currentPlayer = computed(() =>
    players.value.find(p => p.id === playerId.value) ?? null
  )

  const isMyTurn = computed(() =>
    players.value[currentPlayerIndex.value]?.id === playerId.value
  )

  const canRoll = computed(() =>
    status.value === 'playing' && isMyTurn.value && phase.value === 'roll'
  )

  const canAct = computed(() =>
    status.value === 'playing' && isMyTurn.value && phase.value === 'action'
  )

  const currentProperty = computed(() => {
    if (!currentPlayer.value) return null
    return properties.value.find(p => p.id === currentPlayer.value!.position) ?? null
  })

  const canBuy = computed(() => {
    if (!canAct.value || !currentProperty.value || !currentPlayer.value) return false
    const prop = currentProperty.value
    return (
      (prop.type === 'property' || prop.type === 'railroad' || prop.type === 'utility') &&
      prop.ownerId === null &&
      currentPlayer.value.money >= prop.price
    )
  })

  const myProperties = computed(() => {
    if (!currentPlayer.value) return []
    return properties.value.filter(p => p.ownerId === currentPlayer.value!.id)
  })

  function loadState(state: Partial<GameState>) {
    if (state.roomId) roomId.value = state.roomId
    if (state.hostId !== undefined) hostId.value = state.hostId
    if (state.status) status.value = state.status
    if (state.players) players.value = state.players
    if (state.properties) properties.value = state.properties
    if (state.turn) turn.value = state.turn
    if (state.currentPlayerIndex !== undefined) currentPlayerIndex.value = state.currentPlayerIndex
    if (state.phase) phase.value = state.phase
    if (state.dice) dice.value = state.dice
    if (state.doubleCount !== undefined) doubleCount.value = state.doubleCount
    if (state.logs) logs.value = state.logs
    if (state.winner !== undefined) winner.value = state.winner
  }

  function setPlayerId(id: number) {
    playerId.value = id
  }

  function reset() {
    roomId.value = ''
    hostId.value = 0
    playerId.value = 0
    players.value = []
    properties.value = []
    turn.value = 1
    currentPlayerIndex.value = 0
    phase.value = 'waiting'
    dice.value = [0, 0]
    doubleCount.value = 0
    logs.value = []
    winner.value = null
    status.value = 'waiting'
  }

  return {
    roomId, hostId, playerId, players, properties, turn, currentPlayerIndex,
    phase, dice, doubleCount, logs, winner, status,
    currentPlayer, isMyTurn, canRoll, canAct, currentProperty, canBuy, myProperties,
    loadState, setPlayerId, reset,
  }
})
