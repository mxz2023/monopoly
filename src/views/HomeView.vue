<template>
  <div class="home-view">
    <div class="home-bg">
      <div class="home-content">
        <h1 class="game-title">大富翁</h1>
        <p class="game-subtitle">MONOPOLY ONLINE</p>

        <div class="account-bar">
          <div class="account-info">
            <span class="account-nick">{{ auth.user?.nickname }}</span>
            <span class="account-meta">💰 {{ auth.user?.money ?? 0 }}</span>
            <span class="account-meta">🏠 {{ auth.user?.properties?.length ?? 0 }} 处产业</span>
          </div>
          <div class="account-actions">
            <button type="button" class="link-btn" @click="openNickEdit">改昵称</button>
            <button type="button" class="link-btn logout" @click="doLogout">退出登录</button>
          </div>
        </div>

        <div v-if="nickDialog" class="nick-dialog-overlay" @click.self="nickDialog = false">
          <div class="nick-dialog">
            <h3>修改游戏昵称</h3>
            <input v-model="nickDraft" class="input" maxlength="8" placeholder="最多 8 字" @keyup.enter="saveNickname" />
            <div class="nick-dialog-btns">
              <button class="btn btn-secondary" type="button" @click="nickDialog = false">取消</button>
              <button class="btn btn-primary" type="button" @click="saveNickname">保存</button>
            </div>
          </div>
        </div>

        <div class="form-card">
          <div class="input-group">
            <label>选择头像</label>
            <div class="avatar-grid">
              <div
                v-for="(avatar, idx) in AVATARS"
                :key="idx"
                class="avatar-option"
                :class="{ selected: selectedAvatar === avatar }"
                @click="selectedAvatar = avatar"
              >
                {{ avatar }}
              </div>
            </div>
          </div>

          <div class="btn-group">
            <button class="btn btn-primary" @click="createRoom">
              创建房间
            </button>
            <button class="btn btn-secondary" @click="toggleJoin">
              加入房间
            </button>
          </div>

          <div v-if="showJoin" class="join-form">
            <div class="room-list-header">
              <label>当前房间</label>
              <button class="refresh-btn" @click="fetchRoomList" title="刷新">
                ↻
              </button>
            </div>

            <div v-if="roomList.length === 0" class="no-rooms">
              暂无房间，请先创建
            </div>

            <div v-else class="room-list">
              <div
                v-for="room in roomList"
                :key="room.roomId"
                class="room-item"
              >
                <div class="room-info">
                  <span class="room-id">{{ room.roomId }}</span>
                  <span class="room-host">{{ room.hostName }} 的房间</span>
                </div>
                <div class="room-meta">
                  <span class="room-count">{{ room.playerCount }}/{{ room.maxPlayers }}</span>
                  <span v-if="room.status !== 'waiting'" class="room-tag playing">游戏中</span>
                  <span v-else-if="room.playerCount >= room.maxPlayers" class="room-tag full">已满</span>
                  <span v-else class="room-tag open">等待中</span>
                  <button
                    class="enter-btn"
                    :disabled="room.status !== 'waiting' || room.playerCount >= room.maxPlayers"
                    @click="quickJoin(room)"
                  >
                    进入
                  </button>
                </div>
              </div>
            </div>

            <div class="divider"><span>或手动输入房间号</span></div>

            <div class="input-group">
              <label>房间号</label>
              <input
                v-model="roomId"
                type="text"
                placeholder="输入房间号"
                maxlength="6"
                class="input"
                @keyup.enter="joinRoom"
              />
            </div>
            <button class="btn btn-primary btn-block" @click="joinRoom" :disabled="!roomId.trim()">
              加入
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { wsService } from '../services/websocket'
import { useGameStore } from '../stores/gameStore'
import { useAuthStore } from '../stores/authStore'
import { AVATARS } from '../types'
import { getWebSocketUrl } from '../config/ws'

const router = useRouter()
const gameStore = useGameStore()
const auth = useAuthStore()

const selectedAvatar = ref(localStorage.getItem('monopoly_avatar') || AVATARS[0])
const nickDialog = ref(false)
const nickDraft = ref('')

onMounted(() => {
  auth.fetchMe()
})

function openNickEdit() {
  nickDraft.value = auth.user?.nickname ?? ''
  nickDialog.value = true
}

async function saveNickname() {
  const n = nickDraft.value.trim().slice(0, 8)
  if (!n) return
  try {
    await auth.updateNickname(n)
    nickDialog.value = false
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '保存失败')
  }
}

function doLogout() {
  wsService.disconnect()
  gameStore.reset()
  auth.logout()
  router.push('/login')
}
const roomId = ref('')
const showJoin = ref(false)
const roomList = ref<{ roomId: string; hostName: string; playerCount: number; maxPlayers: number; status: string }[]>([])

let listWs: WebSocket | null = null

function toggleJoin() {
  showJoin.value = !showJoin.value
  if (showJoin.value) {
    fetchRoomList()
  }
}

function fetchRoomList() {
  if (listWs) listWs.close()
  const wsUrl = getWebSocketUrl()

  listWs = new WebSocket(wsUrl)
  listWs.onopen = () => {
    listWs!.send(JSON.stringify({ type: 'get_room_list' }))
  }
  listWs.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'room_list') {
      roomList.value = data.rooms
      listWs!.close()
    }
  }
  listWs.onerror = () => {
    listWs!.close()
  }
}

function quickJoin(room: { roomId: string; status: string; playerCount: number; maxPlayers: number }) {
  if (room.status !== 'waiting' || room.playerCount >= room.maxPlayers) return
  roomId.value = room.roomId
  joinRoom()
}

function createRoom() {
  localStorage.setItem('monopoly_avatar', selectedAvatar.value)

  wsService.connect(getWebSocketUrl())

  wsService.once('room_created', (data) => {
    gameStore.setPlayerId(data.playerId)
    gameStore.loadState(data)
    auth.fetchMe()
    router.push(`/room/${data.roomId}`)
  })

  wsService.once('error', (data) => {
    alert(data.message)
  })

  wsService.send({ type: 'create_room', avatar: selectedAvatar.value })
}

function joinRoom() {
  if (!roomId.value.trim()) return
  localStorage.setItem('monopoly_avatar', selectedAvatar.value)

  wsService.connect(getWebSocketUrl())

  wsService.once('room_joined', (data) => {
    gameStore.setPlayerId(data.playerId)
    gameStore.loadState(data)
    auth.fetchMe()
    router.push(`/room/${data.roomId}`)
  })

  wsService.once('error', (data) => {
    alert(data.message)
  })

  wsService.send({
    type: 'join_room',
    roomId: roomId.value.trim().toUpperCase(),
    avatar: selectedAvatar.value,
  })
}
</script>

<style scoped>
.home-view {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.home-bg {
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-content {
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.game-title {
  font-size: 64px;
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin: 0;
  letter-spacing: 12px;
}

.game-subtitle {
  color: rgba(255, 215, 0, 0.5);
  letter-spacing: 8px;
  font-size: 16px;
  margin: 8px 0 24px;
}

.account-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px 14px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  text-align: left;
}
.account-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #ccc;
}
.account-nick {
  color: #ffd700;
  font-weight: 600;
  font-size: 15px;
}
.account-meta {
  color: #aaa;
}
.account-actions {
  display: flex;
  gap: 8px;
}
.link-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #3498db;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.link-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}
.link-btn.logout {
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.35);
}
.nick-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.nick-dialog {
  background: rgba(30, 30, 60, 0.98);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 320px;
}
.nick-dialog h3 {
  margin: 0 0 12px;
  color: #ffd700;
  font-size: 16px;
}
.nick-dialog-btns {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.nick-dialog-btns .btn {
  flex: 1;
}

.form-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  backdrop-filter: blur(10px);
}

.input-group {
  margin-bottom: 16px;
  text-align: left;
}

.input-group label {
  display: block;
  color: #aaa;
  font-size: 13px;
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.input:focus {
  border-color: #ffd700;
}

.input::placeholder {
  color: #555;
}

.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.avatar-option {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.avatar-option:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

.avatar-option.selected {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.3);
  transform: scale(1.15);
}

.btn-group {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a3e;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.join-form {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.room-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.room-list-header label {
  display: block;
  color: #aaa;
  font-size: 13px;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #aaa;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffd700;
}

.no-rooms {
  text-align: center;
  color: #666;
  padding: 20px 0;
  font-size: 14px;
}

.room-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s;
}

.room-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.room-id {
  color: #ffd700;
  font-weight: 600;
  font-size: 14px;
}

.room-host {
  color: #888;
  font-size: 12px;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-count {
  color: #aaa;
  font-size: 13px;
}

.room-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.room-tag.open {
  background: rgba(0, 200, 83, 0.15);
  color: #4caf50;
}

.room-tag.playing {
  background: rgba(255, 152, 0, 0.15);
  color: #ff9800;
}

.room-tag.full {
  background: rgba(244, 67, 54, 0.15);
  color: #f44336;
}

.enter-btn {
  padding: 4px 14px;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a3e;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.enter-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.enter-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.1);
  color: #666;
}

.divider {
  text-align: center;
  position: relative;
  margin: 14px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.divider span {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  padding: 0 10px;
  color: #555;
  font-size: 12px;
}

.btn-block {
  flex: unset;
  width: 100%;
  margin-top: 10px;
}
</style>
