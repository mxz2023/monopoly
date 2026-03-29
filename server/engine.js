import { WebSocket } from 'ws'
import { MAP_DATA, CHANCE_CARDS, CHEST_CARDS, TOTAL_CELLS, JAIL_POS, GO_TO_JAIL_POS, PLAYER_AVATARS } from './data.js'
import { verifyTokenGetUser, loadUserProgress, saveUserProgress } from './auth.js'

// ---- Game Engine ----

export const rooms = new Map()

function persistPlayerProgress(player) {
  if (!player) return
  if (player.status === 'bankrupt') {
    saveUserProgress(player.id, { money: 0, properties: [] })
    return
  }
  saveUserProgress(player.id, {
    money: Math.max(0, player.money),
    properties: [...player.properties],
  })
}

function findUserInAnyRoom(userId) {
  for (const [, room] of rooms) {
    const p = room.players.find((x) => x.id === userId)
    if (p) return { room, player: p }
  }
  return null
}

/** 新一局开始：从起点出发，按账户载入资金与产业（棋盘格与玩家列表一致） */
function applyAccountStateToRoom(room) {
  for (const p of room.properties) {
    p.ownerId = null
    p.houses = 0
    p.hotel = false
    p.mortgage = false
  }
  for (const player of room.players) {
    const saved = loadUserProgress(player.id)
    player.money = saved.money
    player.properties = []
    player.position = 0
    player.inJail = false
    player.jailTurns = 0
    player.status = 'active'
    for (const pid of saved.properties) {
      const prop = room.properties.find((pr) => pr.id === pid)
      if (prop && prop.ownerId === null) {
        prop.ownerId = player.id
        player.properties.push(pid)
      }
    }
  }
}

function createRoom() {
  const id = Math.random().toString(36).substring(2, 8).toUpperCase()
  const room = {
    id,
    hostId: -1,
    players: [],
    properties: MAP_DATA.map(p => ({
      ...p,
      ownerId: null,
      mortgage: false,
      houses: 0,
      hotel: false,
    })),
    status: 'waiting',
    currentPlayerIndex: 0,
    turn: 1,
    dice: [0, 0],
    doubleCount: 0,
    logs: [],
    winner: null,
    phase: 'waiting',
    usedChanceIds: new Set(),
    usedChestIds: new Set(),
  }
  rooms.set(id, room)
  return room
}

function getPlayerSnapshot(player) {
  const { ws, ...rest } = player
  return rest
}

function getRoomState(room) {
  return {
    roomId: room.id,
    hostId: room.hostId,
    status: room.status,
    players: room.players.map(p => getPlayerSnapshot(p)),
    properties: room.properties,
    turn: room.turn,
    currentPlayerIndex: room.currentPlayerIndex,
    phase: room.phase,
    dice: room.dice,
    doubleCount: room.doubleCount,
    logs: room.logs.slice(-50),
    winner: room.winner,
  }
}

function broadcast(room, excludeId) {
  const state = getRoomState(room)
  const msg = JSON.stringify({ type: 'state_update', ...state })
  for (const p of room.players) {
    if (p.ws && p.ws.readyState === WebSocket.OPEN && p.id !== excludeId) {
      p.ws.send(msg)
    }
  }
  if (room.status === 'playing') {
    for (const p of room.players) {
      if (p.status === 'active') persistPlayerProgress(p)
    }
  }
}

function addLog(room, message, type) {
  room.logs.push({
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    message,
    type,
  })
}

function shuffleAndPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function drawCard(room, cardType) {
  if (cardType === 'chance') {
    if (room.usedChanceIds.size >= CHANCE_CARDS.length) room.usedChanceIds.clear()
    let card
    do { card = shuffleAndPick(CHANCE_CARDS) } while (room.usedChanceIds.has(card.id))
    room.usedChanceIds.add(card.id)
    return { ...card, type: 'chance' }
  } else {
    if (room.usedChestIds.size >= CHEST_CARDS.length) room.usedChestIds.clear()
    let card
    do { card = shuffleAndPick(CHEST_CARDS) } while (room.usedChestIds.has(card.id))
    room.usedChestIds.add(card.id)
    return { ...card, type: 'chest' }
  }
}

function getRentAmount(prop, room, diceSum) {
  if (prop.type === 'railroad') {
    const railroadCount = room.properties.filter(p => p.type === 'railroad' && p.ownerId === prop.ownerId).length
    return prop.rent[Math.min(railroadCount - 1, 3)] || 250
  }
  if (prop.type === 'utility') {
    const utilCount = room.properties.filter(p => p.type === 'utility' && p.ownerId === prop.ownerId).length
    return utilCount >= 2 ? diceSum * 10 : diceSum * 4
  }
  if (prop.type === 'property') {
    const idx = prop.hotel ? 5 : prop.houses
    return prop.rent[idx] || prop.rent[0]
  }
  return 0
}

function checkBankruptcy(room, player) {
  if (player.money < 0) {
    let totalAsset = 0
    for (const propId of player.properties) {
      const prop = room.properties.find(p => p.id === propId)
      if (prop && !prop.mortgage) {
        totalAsset += Math.floor(prop.price / 2)
      }
    }
    if (totalAsset + player.money >= 0) {
      addLog(room, `${player.name} 资金不足！请出售房产或抵押来筹集资金。`, 'info')
      return false
    }
    player.status = 'bankrupt'
    player.properties.forEach(pid => {
      const prop = room.properties.find(p => p.id === pid)
      if (prop) { prop.ownerId = null; prop.houses = 0; prop.hotel = false; prop.mortgage = false }
    })
    player.properties = []
    addLog(room, `${player.name} 破产了！退出游戏。`, 'bankrupt')
    return true
  }
  return false
}

function checkGameOver(room) {
  const activePlayers = room.players.filter(p => p.status === 'active')
  if (activePlayers.length <= 1) {
    room.status = 'finished'
    room.winner = activePlayers[0]?.id ?? -1
    if (room.winner >= 0) {
      addLog(room, `${activePlayers[0].name} 赢得了游戏！`, 'info')
    }
    return true
  }
  return false
}

function moveToNextPlayer(room) {
  const activePlayers = room.players.filter(p => p.status === 'active')
  if (activePlayers.length <= 1) return

  const prevIndex = room.currentPlayerIndex
  let idx = prevIndex
  do {
    idx = (idx + 1) % room.players.length
  } while (room.players[idx].status !== 'active')

  room.currentPlayerIndex = idx
  if (idx < prevIndex) {
    room.turn++
  }
  room.phase = 'roll'
  room.dice = [0, 0]
  room.doubleCount = 0
}

// ---- Message Handlers ----

function handleRollDice(room, player) {
  if (room.status !== 'playing') return
  if (room.players[room.currentPlayerIndex].id !== player.id) return
  if (room.phase !== 'roll') return

  const d1 = Math.floor(Math.random() * 6) + 1
  const d2 = Math.floor(Math.random() * 6) + 1
  room.dice = [d1, d2]

  addLog(room, `${player.name} 掷出了 [${d1}] [${d2}]`, 'info')

  if (d1 === d2) {
    room.doubleCount++
    addLog(room, `${player.name} 掷出双数！`, 'info')
    if (room.doubleCount >= 3) {
      addLog(room, `${player.name} 连续三次双数，进入监狱！`, 'jail')
      player.inJail = true
      player.jailTurns = 0
      player.position = JAIL_POS
      room.phase = 'action'
      broadcast(room)
      return
    }
  } else {
    room.doubleCount = 0
  }

  if (player.inJail) {
    if (d1 === d2) {
      player.inJail = false
      player.jailTurns = 0
      addLog(room, `${player.name} 掷出双数，越狱成功！`, 'jail')
    } else {
      player.jailTurns++
      if (player.jailTurns >= 3) {
        player.money -= 500
        player.inJail = false
        player.jailTurns = 0
        addLog(room, `${player.name} 三回合未掷出双数，支付 $500 出狱`, 'jail')
      } else {
        addLog(room, `${player.name} 仍在监狱中 (${player.jailTurns}/3)`, 'jail')
        room.phase = 'action'
        broadcast(room)
        return
      }
    }
  }

  const steps = d1 + d2
  const oldPos = player.position
  player.position = (player.position + steps) % TOTAL_CELLS

  if (player.position < oldPos && steps > 0) {
    player.money += 200
    addLog(room, `${player.name} 经过起点，获得 $200`, 'pay')
  }

  addLog(room, `${player.name} 前进 ${steps} 步，到达 ${MAP_DATA[player.position].name}`, 'info')

  handleLanding(room, player)

  if (checkGameOver(room)) {
    broadcast(room)
    return
  }

  broadcast(room)
}

function handleLanding(room, player) {
  const prop = room.properties[player.position]

  switch (prop.type) {
    case 'property':
    case 'railroad':
    case 'utility':
      if (prop.ownerId === null) {
        room.phase = 'action'
      } else if (prop.ownerId !== player.id && !prop.mortgage) {
        const rent = getRentAmount(prop, room, room.dice[0] + room.dice[1])
        player.money -= rent
        const owner = room.players.find(p => p.id === prop.ownerId)
        if (owner) owner.money += rent
        addLog(room, `${player.name} 向 ${owner?.name} 支付 $${rent} 租金 (${prop.name})`, 'rent')
        checkBankruptcy(room, player)
        room.phase = 'action'
      } else {
        room.phase = 'action'
      }
      break

    case 'chance': {
      const card = drawCard(room, 'chance')
      addLog(room, `${player.name} 抽到机会卡: ${card.title}`, 'card')
      handleCard(room, player, card)
      break
    }

    case 'chest': {
      const card = drawCard(room, 'chest')
      addLog(room, `${player.name} 抽到命运卡: ${card.title}`, 'card')
      handleCard(room, player, card)
      break
    }

    case 'corner':
      if (player.position === GO_TO_JAIL_POS) {
        player.inJail = true
        player.jailTurns = 0
        player.position = JAIL_POS
        addLog(room, `${player.name} 被送入监狱！`, 'jail')
      }
      room.phase = 'action'
      break

    default:
      room.phase = 'action'
  }
}

function handleCard(room, player, card) {
  switch (card.action) {
    case 'collect':
      player.money += card.value
      addLog(room, `${player.name} 获得 $${card.value}`, 'pay')
      break
    case 'pay':
      player.money -= card.value
      addLog(room, `${player.name} 支付 $${card.value}`, 'pay')
      checkBankruptcy(room, player)
      break
    case 'goto':
      if (card.value === 0) {
        player.money += 200
        addLog(room, `${player.name} 到达起点，获得 $200`, 'pay')
      } else if (card.value === JAIL_POS) {
        player.position = JAIL_POS
      } else {
        player.position = card.value
        handleLanding(room, player)
        return
      }
      break
    case 'jail':
      player.inJail = true
      player.jailTurns = 0
      player.position = JAIL_POS
      addLog(room, `${player.name} 被送入监狱！`, 'jail')
      break
    case 'birthday':
      for (const p of room.players) {
        if (p.id !== player.id && p.status === 'active') {
          p.money -= card.value
          player.money += card.value
        }
      }
      addLog(room, `所有玩家向 ${player.name} 支付 $${card.value}`, 'pay')
      break
    case 'move_back':
      player.position = (player.position - card.value + TOTAL_CELLS) % TOTAL_CELLS
      addLog(room, `${player.name} 后退 ${card.value} 步`, 'info')
      handleLanding(room, player)
      return
    case 'repair': {
      let total = 0
      for (const propId of player.properties) {
        const prop = room.properties.find(p => p.id === propId)
        if (prop) {
          total += prop.hotel ? card.value * 4 : prop.houses * card.value
        }
      }
      player.money -= total
      addLog(room, `${player.name} 支付 $${total} 修缮费`, 'pay')
      checkBankruptcy(room, player)
      break
    }
  }
  room.phase = 'action'
}

function handleBuyProperty(room, player) {
  if (room.status !== 'playing') return
  if (room.players[room.currentPlayerIndex].id !== player.id) return
  if (room.phase !== 'action') return

  const prop = room.properties[player.position]
  if (prop.ownerId !== null) return
  if (prop.type !== 'property' && prop.type !== 'railroad' && prop.type !== 'utility') return
  if (player.money < prop.price) return

  player.money -= prop.price
  prop.ownerId = player.id
  player.properties.push(prop.id)

  addLog(room, `${player.name} 购买了 ${prop.name} ($${prop.price})`, 'buy')
  broadcast(room)
}

function handleSkipBuy(room, player) {
  if (room.status !== 'playing') return
  if (room.players[room.currentPlayerIndex].id !== player.id) return
  if (room.phase !== 'action') return
  broadcast(room)
}

function handleEndTurn(room, player) {
  if (room.status !== 'playing') return
  if (room.players[room.currentPlayerIndex].id !== player.id) return
  if (room.phase !== 'action') return

  addLog(room, `${player.name} 结束回合`, 'info')

  if (room.dice[0] === room.dice[1] && !player.inJail && room.doubleCount > 0) {
    room.phase = 'roll'
    addLog(room, `${player.name} 双数奖励，再掷一次！`, 'info')
    broadcast(room)
    return
  }

  moveToNextPlayer(room)
  if (checkGameOver(room)) {
    broadcast(room)
    return
  }

  const current = room.players[room.currentPlayerIndex]
  addLog(room, `轮到 ${current.name} 行动`, 'info')
  broadcast(room)
}

function handleBuildHouse(room, player, propertyId) {
  if (room.status !== 'playing') return
  if (room.phase !== 'action') return

  const prop = room.properties.find(p => p.id === propertyId)
  if (!prop || prop.ownerId !== player.id) return
  if (prop.type !== 'property') return
  if (prop.houses >= 4 && !prop.hotel) {
    if (player.money < 500) return
    player.money -= 500
    prop.hotel = true
    addLog(room, `${player.name} 在 ${prop.name} 建造了酒店`, 'buy')
  } else if (prop.houses < 4) {
    const cost = Math.floor(prop.price * 0.5)
    if (player.money < cost) return
    const groupProps = room.properties.filter(p => p.group === prop.group && p.type === 'property')
    const ownsAll = groupProps.every(p => p.ownerId === player.id)
    if (!ownsAll) return
    player.money -= cost
    prop.houses++
    addLog(room, `${player.name} 在 ${prop.name} 建造了第 ${prop.houses} 栋房屋 ($${cost})`, 'buy')
  }

  broadcast(room)
}

function handleMortgage(room, player, propertyId) {
  if (room.status !== 'playing') return
  if (room.phase !== 'action') return

  const prop = room.properties.find(p => p.id === propertyId)
  if (!prop || prop.ownerId !== player.id) return
  if (prop.houses > 0 || prop.hotel) return

  if (prop.mortgage) {
    if (player.money < Math.floor(prop.price * 0.55)) return
    player.money -= Math.floor(prop.price * 0.55)
    prop.mortgage = false
    addLog(room, `${player.name} 赎回了 ${prop.name}`, 'buy')
  } else {
    player.money += Math.floor(prop.price / 2)
    prop.mortgage = true
    addLog(room, `${player.name} 抵押了 ${prop.name}，获得 $${Math.floor(prop.price / 2)}`, 'pay')
  }

  broadcast(room)
}

function handlePayJailFee(room, player) {
  if (room.status !== 'playing') return
  if (room.phase !== 'roll') return
  if (!player.inJail) return
  if (room.players[room.currentPlayerIndex].id !== player.id) return

  player.money -= 500
  player.inJail = false
  player.jailTurns = 0
  addLog(room, `${player.name} 支付 $500 出狱`, 'jail')
  broadcast(room)
}

/** WebSocket 消息路由（由 index.js 调用） */
export function routeMessage(ws, msg) {
  let currentRoom = null
  let currentPlayer = null
  for (const [, room] of rooms) {
    const found = room.players.find(p => p.ws === ws)
    if (found) {
      currentRoom = room
      currentPlayer = found
      break
    }
  }

  switch (msg.type) {
    case 'get_room_list': {
      const list = []
      for (const [id, room] of rooms) {
        list.push({
          roomId: id,
          hostName: room.hostId >= 0 ? room.players.find(p => p.id === room.hostId)?.name ?? '' : '',
          playerCount: room.players.length,
          maxPlayers: room.maxPlayers || 4,
          status: room.status === 'waiting' ? 'waiting' : 'playing',
        })
      }
      ws.send(JSON.stringify({ type: 'room_list', rooms: list }))
      break
    }
    case 'create_room': {
      let user
      try {
        user = verifyTokenGetUser(msg.token)
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: '请先登录' }))
        return
      }
      if (findUserInAnyRoom(user.id)) {
        ws.send(JSON.stringify({ type: 'error', message: '请先离开当前房间' }))
        return
      }
      const room = createRoom()
      const progress = loadUserProgress(user.id)
      const player = {
        id: user.id,
        userId: user.id,
        name: user.nickname,
        avatar: msg.avatar || PLAYER_AVATARS[(user.id - 1) % PLAYER_AVATARS.length],
        money: progress.money,
        position: 0,
        properties: [],
        status: 'active',
        jailTurns: 0,
        inJail: false,
        isReady: false,
        ws,
      }
      room.players.push(player)
      room.hostId = user.id
      ws.send(JSON.stringify({
        type: 'room_created',
        roomId: room.id,
        playerId: player.id,
        ...getRoomState(room),
      }))
      console.log(`Room ${room.id} created by ${player.name}`)
      break
    }

    case 'join_room': {
      let user
      try {
        user = verifyTokenGetUser(msg.token)
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: '请先登录' }))
        return
      }
      if (findUserInAnyRoom(user.id)) {
        ws.send(JSON.stringify({ type: 'error', message: '请先离开当前房间' }))
        return
      }
      const room = rooms.get(msg.roomId)
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }))
        return
      }
      if (room.status !== 'waiting') {
        ws.send(JSON.stringify({ type: 'error', message: '游戏已开始' }))
        return
      }
      if (room.players.length >= 6) {
        ws.send(JSON.stringify({ type: 'error', message: '房间已满' }))
        return
      }
      const progress = loadUserProgress(user.id)
      const player = {
        id: user.id,
        userId: user.id,
        name: user.nickname,
        avatar: msg.avatar || PLAYER_AVATARS[(user.id - 1) % PLAYER_AVATARS.length],
        money: progress.money,
        position: 0,
        properties: [],
        status: 'active',
        jailTurns: 0,
        inJail: false,
        isReady: false,
        ws,
      }
      room.players.push(player)
      ws.send(JSON.stringify({
        type: 'room_joined',
        playerId: player.id,
        ...getRoomState(room),
      }))
      broadcast(room, player.id)
      console.log(`${player.name} joined room ${room.id}`)
      break
    }

    case 'toggle_ready': {
      if (currentPlayer && currentRoom) {
        currentPlayer.isReady = !currentPlayer.isReady
        broadcast(currentRoom)
      }
      break
    }

    case 'start_game': {
      if (currentRoom && currentRoom.hostId === currentPlayer?.id) {
        if (currentRoom.players.length < 2) {
          ws.send(JSON.stringify({ type: 'error', message: '至少需要 2 名玩家' }))
          return
        }
        if (!currentRoom.players.filter(p => p.id !== currentRoom.hostId).every(p => p.isReady)) {
          ws.send(JSON.stringify({ type: 'error', message: '所有玩家需要准备就绪' }))
          return
        }
        currentRoom.status = 'playing'
        currentRoom.phase = 'roll'
        applyAccountStateToRoom(currentRoom)
        addLog(currentRoom, '游戏开始！已从起点出发，资金与产业已按账户载入。', 'info')
        addLog(currentRoom, `轮到 ${currentRoom.players[0].name} 掷骰子`, 'info')
        broadcast(currentRoom)
        console.log(`Game started in room ${currentRoom.id}`)
      }
      break
    }

    case 'roll_dice':
      if (currentRoom && currentPlayer) handleRollDice(currentRoom, currentPlayer)
      break

    case 'buy_property':
      if (currentRoom && currentPlayer) handleBuyProperty(currentRoom, currentPlayer)
      break

    case 'skip_buy':
      if (currentRoom && currentPlayer) handleSkipBuy(currentRoom, currentPlayer)
      break

    case 'end_turn':
      if (currentRoom && currentPlayer) handleEndTurn(currentRoom, currentPlayer)
      break

    case 'build_house':
      if (currentRoom && currentPlayer) handleBuildHouse(currentRoom, currentPlayer, msg.propertyId)
      break

    case 'mortgage':
      if (currentRoom && currentPlayer) handleMortgage(currentRoom, currentPlayer, msg.propertyId)
      break

    case 'pay_jail_fee':
      if (currentRoom && currentPlayer) handlePayJailFee(currentRoom, currentPlayer)
      break

    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown action' }))
  }
}

export function handleConnectionClose(ws) {
  for (const [, room] of rooms) {
    const idx = room.players.findIndex(p => p.ws === ws)
    if (idx >= 0) {
      const player = room.players[idx]
      if (room.status === 'playing') {
        persistPlayerProgress(player)
      }
      room.players.splice(idx, 1)
      addLog(room, `${player.name} 离开了游戏`, 'info')
      if (room.players.length === 0) {
        rooms.delete(room.id)
        console.log(`Room ${room.id} deleted (empty)`)
      } else {
        if (room.hostId === player.id) {
          room.hostId = room.players[0].id
        }
        broadcast(room)
      }
      break
    }
  }
  console.log('Connection closed')
}
