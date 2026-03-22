import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'

// ---- Game Data (inline for server) ----

const TOTAL_CELLS = 52
const JAIL_POS = 26
const GO_TO_JAIL_POS = 39

const MAP_DATA = [
  { id:0,name:'起点',type:'corner',price:0,rent:[],color:'',group:0 },
  { id:1,name:'无人零售店',type:'property',price:2200,rent:[70,350,1100,2200,3800,6000],color:'#8B4513',group:1 },
  { id:2,name:'米其林AI餐厅',type:'property',price:2400,rent:[80,400,1200,2400,4000,6500],color:'#8B4513',group:1 },
  { id:3,name:'机会',type:'chance',price:0,rent:[],color:'',group:0 },
  { id:4,name:'清华大学',type:'property',price:2600,rent:[90,450,1300,2600,4500,7000],color:'#87CEEB',group:2 },
  { id:5,name:'机器人物流公司',type:'property',price:2600,rent:[90,450,1300,2600,4500,7000],color:'#87CEEB',group:2 },
  { id:6,name:'芯片工厂',type:'railroad',price:2000,rent:[250,500,1000,2000],color:'',group:8 },
  { id:7,name:'无人车4S店',type:'property',price:2800,rent:[100,500,1500,2800,5000,7500],color:'#FF69B4',group:3 },
  { id:8,name:'智能游乐园',type:'property',price:1600,rent:[50,250,800,1600,2700,4300],color:'#FF69B4',group:3 },
  { id:9,name:'命运卡',type:'chest',price:0,rent:[],color:'',group:0 },
  { id:10,name:'CV研究院',type:'property',price:1500,rent:[50,250,750,1500,2500,4000],color:'#FFA500',group:4 },
  { id:11,name:'无人酒店',type:'property',price:2000,rent:[60,300,1000,2000,3500,5500],color:'#FFA500',group:4 },
  { id:12,name:'诺亚动物园',type:'property',price:2300,rent:[80,400,1100,2300,3500,5500],color:'#FFA500',group:4 },
  { id:13,name:'宇航局',type:'corner',price:0,rent:[],color:'',group:0 },
  { id:14,name:'智能社区',type:'property',price:600,rent:[20,100,300,600,1000,1600],color:'#FF0000',group:5 },
  { id:15,name:'记忆管理社',type:'property',price:2000,rent:[60,300,1000,2000,3500,5500],color:'#FF0000',group:5 },
  { id:16,name:'急救云医院',type:'property',price:3000,rent:[100,500,1500,3000,5000,8000],color:'#FF0000',group:5 },
  { id:17,name:'垃圾处理站',type:'utility',price:2400,rent:[40,100],color:'',group:9 },
  { id:18,name:'机器人工厂',type:'railroad',price:2800,rent:[250,500,1000,2000],color:'',group:8 },
  { id:19,name:'AI广告公司',type:'property',price:1600,rent:[50,250,800,1600,2700,4300],color:'#FFFF00',group:6 },
  { id:20,name:'穿戴设备店',type:'property',price:2000,rent:[60,300,1000,2000,3500,5500],color:'#FFFF00',group:6 },
  { id:21,name:'NLP研究院',type:'property',price:2000,rent:[60,300,1000,2000,3500,5500],color:'#FFFF00',group:6 },
  { id:22,name:'自助时装店',type:'property',price:1200,rent:[40,200,600,1200,2000,3200],color:'#008000',group:7 },
  { id:23,name:'VR酒吧',type:'property',price:1400,rent:[50,250,700,1400,2300,3800],color:'#008000',group:7 },
  { id:24,name:'命运卡',type:'chest',price:0,rent:[],color:'',group:0 },
  { id:25,name:'科技健身馆',type:'property',price:2400,rent:[80,400,1200,2400,4000,6500],color:'#008000',group:7 },
  { id:26,name:'监狱',type:'corner',price:0,rent:[],color:'',group:0 },
  { id:27,name:'AI美容店',type:'property',price:2000,rent:[60,300,1000,2000,3500,5500],color:'#0000CD',group:10 },
  { id:28,name:'经典剧院',type:'property',price:3000,rent:[100,500,1500,3000,5000,8000],color:'#0000CD',group:10 },
  { id:29,name:'OCR研究院',type:'property',price:2000,rent:[60,300,1000,2000,3500,5500],color:'#0000CD',group:10 },
  { id:30,name:'创意美术馆',type:'property',price:2400,rent:[80,400,1200,2400,4000,6500],color:'#9400D3',group:11 },
  { id:31,name:'城市导航站',type:'railroad',price:3600,rent:[250,500,1000,2000],color:'',group:8 },
  { id:32,name:'生态农场',type:'property',price:3000,rent:[100,500,1500,3000,5000,8000],color:'#9400D3',group:11 },
  { id:33,name:'无人车工厂',type:'property',price:2200,rent:[70,350,1100,2200,3800,6000],color:'#9400D3',group:11 },
  { id:34,name:'宠物救助站',type:'property',price:2600,rent:[90,450,1300,2600,4500,7000],color:'#FFD700',group:12 },
  { id:35,name:'极客公园',type:'utility',price:1800,rent:[40,100],color:'',group:9 },
  { id:36,name:'机会卡',type:'chance',price:0,rent:[],color:'',group:0 },
  { id:37,name:'体感图书馆',type:'property',price:2000,rent:[60,300,1000,2000,3500,5500],color:'#FFD700',group:12 },
  { id:38,name:'身边闪送站',type:'property',price:1600,rent:[50,250,800,1600,2700,4300],color:'#FFD700',group:12 },
  { id:39,name:'慈善基金会',type:'corner',price:0,rent:[],color:'',group:0 },
  { id:40,name:'共享停车场',type:'property',price:2200,rent:[70,350,1100,2200,3800,6000],color:'#C0C0C0',group:13 },
  { id:41,name:'灵感咖啡店',type:'property',price:2400,rent:[80,400,1200,2400,4000,6500],color:'#C0C0C0',group:13 },
  { id:42,name:'SLAM研究院',type:'property',price:2400,rent:[80,400,1200,2400,4000,6500],color:'#C0C0C0',group:13 },
  { id:43,name:'AI家政公司',type:'property',price:1000,rent:[30,150,500,1000,1600,2700],color:'#00CED1',group:14 },
  { id:44,name:'医药公司',type:'property',price:1600,rent:[50,250,800,1600,2700,4300],color:'#00CED1',group:14 },
  { id:45,name:'硬件工厂',type:'railroad',price:2200,rent:[250,500,1000,2000],color:'',group:8 },
  { id:46,name:'机会卡',type:'chance',price:0,rent:[],color:'',group:0 },
  { id:47,name:'智慧家居店',type:'property',price:2000,rent:[60,300,1000,2000,3500,5500],color:'#FF6347',group:15 },
  { id:48,name:'X研究院',type:'property',price:2200,rent:[70,350,1100,2200,3800,6000],color:'#FF6347',group:15 },
  { id:49,name:'命运卡',type:'chest',price:0,rent:[],color:'',group:0 },
  { id:50,name:'探索共享元',type:'property',price:2800,rent:[100,500,1500,2800,5000,7500],color:'#E6E6FA',group:16 },
  { id:51,name:'科幻度假村',type:'property',price:2600,rent:[90,450,1300,2600,4500,7000],color:'#E6E6FA',group:16 },
]

const CHANCE_CARDS = [
  { id:1, title:'银行发放红利', description:'银行多付你 $500 红利', action:'collect', value:500 },
  { id:2, title:'修建房屋', description:'每栋房屋支付 $250', action:'repair', value:250 },
  { id:3, title:'前往起点', description:'直接前往起点，获得 $200', action:'goto', value:0 },
  { id:4, title:'入狱', description:'直接进入监狱', action:'jail', value:0 },
  { id:5, title:'减税优惠', description:'获得 $150 退税', action:'collect', value:150 },
  { id:6, title:'医疗费用', description:'支付 $500 医疗费', action:'pay', value:500 },
  { id:7, title:'前往无人零售店', description:'前往无人零售店', action:'goto', value:1 },
  { id:8, title:'生日快乐', description:'每位玩家给你 $100', action:'birthday', value:100 },
  { id:9, title:'交通罚款', description:'支付 $200 交通罚款', action:'pay', value:200 },
  { id:10, title:'股票分红', description:'获得 $1000 股票分红', action:'collect', value:1000 },
  { id:11, title:'后退三步', description:'后退三步', action:'move_back', value:3 },
  { id:12, title:'前往探访', description:'前往监狱探访朋友', action:'goto', value:26 },
]

const CHEST_CARDS = [
  { id:101, title:'银行结算错误', description:'银行多付你 $200', action:'collect', value:200 },
  { id:102, title:'彩票中奖', description:'恭喜中奖 $1000！', action:'collect', value:1000 },
  { id:103, title:'医院账单', description:'支付 $1000 医院费用', action:'pay', value:1000 },
  { id:104, title:'遗产继承', description:'继承 $500 遗产', action:'collect', value:500 },
  { id:105, title:'保险赔付', description:'获得 $200 保险赔偿', action:'collect', value:200 },
  { id:106, title:'房屋维修', description:'每栋房屋支付 $400', action:'repair', value:400 },
  { id:107, title:'教育基金', description:'支付 $500 教育基金', action:'pay', value:500 },
  { id:108, title:'年终奖金', description:'获得 $800 年终奖金', action:'collect', value:800 },
  { id:109, title:'入狱', description:'直接进入监狱', action:'jail', value:0 },
  { id:110, title:'投资收益', description:'获得 $300 投资收益', action:'collect', value:300 },
  { id:111, title:'前往起点', description:'前往起点获得 $200', action:'goto', value:0 },
  { id:112, title:'慈善捐款', description:'支付 $250 慈善捐款', action:'pay', value:250 },
]

const PLAYER_AVATARS = ['🤵','👩','🧑','👴','👸','🦸']

// ---- Game Engine ----

const rooms = new Map()
let nextPlayerId = 1

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

  let idx = room.currentPlayerIndex
  do {
    idx = (idx + 1) % room.players.length
  } while (room.players[idx].status !== 'active')

  room.currentPlayerIndex = idx
  if (idx <= room.players.indexOf(activePlayers[0])) {
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

    case 'tax': {
      const taxAmount = player.position === 4 ? 200 : 100
      player.money -= taxAmount
      addLog(room, `${player.name} 缴纳 $${taxAmount} 税款`, 'pay')
      checkBankruptcy(room, player)
      room.phase = 'action'
      break
    }

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

// ---- WebSocket Server ----

const server = createServer()
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  console.log('New connection')

  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message' }))
      return
    }

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
            hostName: room.hostId ? room.players.find(p => p.id === room.hostId)?.name : '',
            playerCount: room.players.length,
            maxPlayers: room.maxPlayers || 4,
            status: room.phase === 'waiting' ? 'waiting' : 'playing',
          })
        }
        ws.send(JSON.stringify({ type: 'room_list', rooms: list }))
        break
      }
      case 'create_room': {
        const room = createRoom()
        const playerId = nextPlayerId++
        const player = {
          id: playerId,
          name: msg.name || `玩家${playerId}`,
          avatar: msg.avatar || PLAYER_AVATARS[(playerId - 1) % PLAYER_AVATARS.length],
          money: 15000,
          position: 0,
          properties: [],
          status: 'active',
          jailTurns: 0,
          inJail: false,
          isReady: false,
          ws,
        }
        room.players.push(player)
        room.hostId = playerId
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
        const playerId = nextPlayerId++
        const player = {
          id: playerId,
          name: msg.name || `玩家${playerId}`,
          avatar: msg.avatar || PLAYER_AVATARS[(playerId - 1) % PLAYER_AVATARS.length],
          money: 15000,
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
        broadcast(room, playerId)
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
          addLog(currentRoom, '游戏开始！', 'info')
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
  })

  ws.on('close', () => {
    for (const [, room] of rooms) {
      const idx = room.players.findIndex(p => p.ws === ws)
      if (idx >= 0) {
        const player = room.players[idx]
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
  })
})

const PORT = 8080
server.listen(PORT, () => {
  console.log(`Monopoly WebSocket server running on ws://localhost:${PORT}/ws`)
})
