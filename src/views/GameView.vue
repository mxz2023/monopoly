<template>
  <div class="game-view">
    <!-- 顶栏 -->
    <div class="top-bar">
      <div class="room-info">
        房间: <span class="room-code">{{ gameStore.roomId }}</span>
        <span class="turn-info">第 {{ gameStore.turn }} 回合</span>
      </div>
      <div v-if="gameStore.status === 'playing'" class="current-turn">
        <span class="current-turn-label">当前:</span>
        <span class="current-turn-name">{{ currentPlayerName }}</span>
        <span v-if="gameStore.isMyTurn" class="my-turn-badge">轮到你了！</span>
      </div>
      <button class="btn-leave" @click="leaveGame">离开</button>
    </div>

    <!-- 游戏主体 -->
    <div class="game-layout">
      <!-- 左侧: 玩家面板 -->
      <PlayerPanel
        :players="gameStore.players"
        :properties="gameStore.properties"
        :currentPlayerIndex="gameStore.currentPlayerIndex"
        :myId="gameStore.playerId"
      />

      <!-- 中间: 棋盘（随中间栏宽高拉伸，不必为正方形） -->
      <div class="board-stage">
        <GameBoard
          :players="gameStore.players"
          :properties="gameStore.properties"
        >
          <template #default>
            <GameLog :logs="gameStore.logs" />
          </template>
        </GameBoard>
      </div>

      <!-- 右侧: 操作面板 -->
      <ActionPanel
        :gamePhase="gameStore.status"
        :dice="gameStore.dice"
        :canRoll="gameStore.canRoll"
        :canAct="gameStore.canAct"
        :isMyTurn="gameStore.isMyTurn"
        :inJail="currentPlayer?.inJail ?? false"
        :currentProperty="gameStore.currentProperty"
        :canBuyProperty="gameStore.canBuy"
        :myProperties="gameStore.myProperties"
        :players="gameStore.players"
        @roll="rollDice"
        @buyProperty="buyProperty"
        @skipBuy="skipBuy"
        @endTurn="endTurn"
        @buildHouse="buildHouse"
        @mortgage="mortgageProperty"
        @payJailFee="payJailFee"
      />
    </div>

    <!-- 游戏结束弹窗 -->
    <div v-if="gameStore.status === 'finished'" class="game-over-overlay">
      <div class="game-over-card">
        <h2>游戏结束</h2>
        <div class="winner-info">
          <span class="winner-avatar">{{ winner?.avatar }}</span>
          <span class="winner-name">{{ winner?.name }}</span>
          <div class="winner-crown">👑 获胜！</div>
        </div>
        <button class="btn btn-back" @click="leaveGame">返回大厅</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { wsService } from '../services/websocket'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import GameBoard from '../components/GameBoard.vue'
import PlayerPanel from '../components/PlayerPanel.vue'
import ActionPanel from '../components/ActionPanel.vue'
import GameLog from '../components/GameLog.vue'

const router = useRouter()
const gameStore = useGameStore()
const auth = useAuthStore()

const currentPlayer = computed(() => gameStore.currentPlayer)
const currentPlayerName = computed(() =>
  gameStore.players[gameStore.currentPlayerIndex]?.name ?? ''
)
const winner = computed(() =>
  gameStore.winner ? gameStore.players.find(p => p.id === gameStore.winner) : null
)

function handleStateUpdate(data: any) {
  gameStore.loadState(data)
}

function rollDice() {
  wsService.send({ type: 'roll_dice' })
}

function buyProperty() {
  wsService.send({ type: 'buy_property' })
}

function skipBuy() {
  wsService.send({ type: 'skip_buy' })
}

function endTurn() {
  wsService.send({ type: 'end_turn' })
}

function buildHouse(propertyId: number) {
  wsService.send({ type: 'build_house', propertyId })
}

function mortgageProperty(propertyId: number) {
  wsService.send({ type: 'mortgage', propertyId })
}

function payJailFee() {
  wsService.send({ type: 'pay_jail_fee' })
}

function leaveGame() {
  wsService.disconnect()
  gameStore.reset()
  auth.fetchMe()
  router.push('/')
}

onMounted(() => {
  wsService.on('state_update', handleStateUpdate)
  wsService.on('error', (data) => {
    console.error('Game error:', data.message)
  })
})
</script>

<style scoped>
.game-view {
  width: 100vw;
  height: 100vh;
  background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 22px;
  background: rgba(0, 0, 0, 0.35);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

.room-info {
  color: #c8cdd8;
  font-size: 16px;
  font-weight: 500;
}

.room-code {
  color: #ffd700;
  font-weight: bold;
  letter-spacing: 2px;
}

.turn-info {
  margin-left: 16px;
  color: #9aa0b4;
  font-size: 15px;
}

.current-turn {
  color: #e8eaf0;
  font-size: 17px;
}

.current-turn-label {
  color: #888;
}

.current-turn-name {
  font-weight: bold;
  color: #ffd700;
}

.my-turn-badge {
  background: #2ecc71;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  margin-left: 8px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.btn-leave {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.35);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-leave:hover {
  background: rgba(231, 76, 60, 0.3);
}

.game-layout {
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 10px;
  padding: 8px 10px;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.board-stage {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.game-over-card {
  background: rgba(30, 30, 60, 0.95);
  border: 2px solid #ffd700;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
}

.game-over-card h2 {
  color: #ffd700;
  font-size: 32px;
  margin: 0 0 24px;
}

.winner-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.winner-avatar {
  font-size: 48px;
}

.winner-name {
  font-size: 24px;
  color: #fff;
  font-weight: bold;
}

.winner-crown {
  font-size: 20px;
  color: #ffd700;
}

.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
}

.btn-back:hover {
  transform: translateY(-2px);
}
</style>
