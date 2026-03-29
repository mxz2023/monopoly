<template>
  <div class="room-view">
    <div class="room-bg">
      <div class="room-content">
        <h2 class="room-header">游戏房间</h2>
        <div class="room-id">
          房间号: <span class="room-code">{{ gameStore.roomId }}</span>
          <button class="copy-btn" @click="copyRoomId" title="复制房间号">📋</button>
        </div>

        <div class="players-list">
          <div
            v-for="player in gameStore.players"
            :key="player.id"
            class="player-item"
            :class="{ 'is-host': player.id === gameStore.hostId, 'is-me': player.id === gameStore.playerId }"
          >
            <span class="player-avatar">{{ player.avatar }}</span>
            <span class="player-name">{{ player.name }}</span>
            <span v-if="player.id === gameStore.hostId" class="host-tag">房主</span>
            <span v-if="player.id === gameStore.playerId" class="me-tag">我</span>
            <span class="ready-status">{{ player.isReady ? '✅' : '⏳' }}</span>
          </div>
          <div v-for="n in emptySlots" :key="'empty-' + n" class="player-item empty">
            <span class="player-avatar">➕</span>
            <span class="player-name">等待加入...</span>
          </div>
        </div>

        <div class="room-actions">
          <button
            v-if="isHost"
            class="btn btn-start"
            @click="startGame"
            :disabled="gameStore.players.length < 2 || !allReady"
          >
            {{ gameStore.players.length < 2 ? '等待玩家 (至少2人)' : allReady ? '开始游戏' : '等待准备...' }}
          </button>
          <button
            v-if="!isHost"
            class="btn"
            :class="gameStore.currentPlayer?.isReady ? 'btn-unready' : 'btn-ready'"
            @click="toggleReady"
          >
            {{ gameStore.currentPlayer?.isReady ? '取消准备' : '准备' }}
          </button>
          <button class="btn btn-leave" @click="leaveRoom">
            离开房间
          </button>
        </div>
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

const router = useRouter()
const gameStore = useGameStore()
const auth = useAuthStore()

const isHost = computed(() => gameStore.playerId === gameStore.hostId)

const allReady = computed(() =>
  gameStore.players
    .filter(p => p.id !== gameStore.hostId)
    .every(p => p.isReady)
)

const emptySlots = computed(() => Math.max(0, 6 - gameStore.players.length))

function copyRoomId() {
  navigator.clipboard.writeText(gameStore.roomId)
  alert('房间号已复制!')
}

function toggleReady() {
  wsService.send({ type: 'toggle_ready' })
}

function startGame() {
  wsService.send({ type: 'start_game' })
}

function leaveRoom() {
  wsService.disconnect()
  gameStore.reset()
  auth.fetchMe()
  router.push('/')
}

function handleStateUpdate(data: any) {
  gameStore.loadState(data)
  if (data.status === 'playing') {
    router.push(`/game/${data.roomId}`)
  }
}

onMounted(() => {
  wsService.on('state_update', handleStateUpdate)
})

onUnmounted(() => {
  // Don't disconnect on unmount if navigating to game
})
</script>

<style scoped>
.room-view {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.room-bg {
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-content {
  text-align: center;
  max-width: 450px;
  width: 90%;
}

.room-header {
  color: #ffd700;
  font-size: clamp(26px, 4vw, 34px);
  font-weight: 800;
  margin: 0 0 18px;
  letter-spacing: 4px;
}

.room-id {
  color: #b8bdd0;
  font-size: 17px;
  margin-bottom: 30px;
}

.room-code {
  color: #ffd700;
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 800;
  letter-spacing: 4px;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  margin-left: 8px;
}

.players-list {
  margin-bottom: 30px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s;
}

.player-item.is-host {
  border-color: rgba(255, 215, 0, 0.3);
  background: rgba(255, 215, 0, 0.05);
}

.player-item.is-me {
  border-color: rgba(52, 152, 219, 0.5);
}

.player-item.empty {
  opacity: 0.3;
}

.player-avatar {
  font-size: 24px;
}

.player-name {
  flex: 1;
  color: #e8eaf0;
  font-size: 17px;
  font-weight: 600;
  text-align: left;
}

.host-tag {
  background: #ffd700;
  color: #1a1a3e;
  font-size: 13px;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 800;
}

.me-tag {
  background: #3498db;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
}

.ready-status {
  font-size: 18px;
}

.room-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  padding: 14px 16px;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-start {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: #fff;
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(46, 204, 113, 0.3);
}

.btn-ready {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: #fff;
}

.btn-unready {
  background: rgba(255, 255, 255, 0.1);
  color: #ddd;
}

.btn-leave {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}
</style>
