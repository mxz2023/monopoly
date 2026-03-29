<template>
  <div class="home-view">
    <div class="home-bg">
      <div class="home-content">
        <h1 class="game-title">大富翁</h1>
        <p class="game-subtitle">MONOPOLY ONLINE</p>

        <div class="account-bar">
          <div class="account-info">
            <span class="account-user">{{ auth.user?.username }}</span>
            <label class="char-label">当前角色</label>
            <select
              class="char-select"
              :value="auth.selectedCharacterId"
              @change="onCharacterChange"
            >
              <option v-for="c in auth.characters" :key="c.id" :value="c.id">
                {{ c.nickname }}
              </option>
            </select>
            <span class="account-meta">💰 {{ auth.selectedCharacter?.money ?? 0 }}</span>
            <span class="account-meta">🏠 {{ auth.selectedCharacter?.properties?.length ?? 0 }} 处产业</span>
          </div>
          <div class="account-actions">
            <button type="button" class="link-btn" @click="openNewChar">新建角色</button>
            <button type="button" class="link-btn" @click="openNickEdit">改昵称</button>
            <button
              v-if="auth.characters.length > 1"
              type="button"
              class="link-btn danger"
              @click="deleteCurrentCharacter"
            >
              删除角色
            </button>
            <button type="button" class="link-btn logout" @click="doLogout">退出登录</button>
          </div>
        </div>

        <div v-if="newCharDialog" class="nick-dialog-overlay" @click.self="newCharDialog = false">
          <div class="nick-dialog">
            <h3>新建角色</h3>
            <input
              v-model="newCharDraft"
              class="input"
              maxlength="8"
              placeholder="角色昵称，最多 8 字"
              @keyup.enter="saveNewCharacter"
            />
            <div class="nick-dialog-btns">
              <button class="btn btn-secondary" type="button" @click="newCharDialog = false">取消</button>
              <button class="btn btn-primary" type="button" @click="saveNewCharacter">创建</button>
            </div>
          </div>
        </div>

        <div v-if="nickDialog" class="nick-dialog-overlay" @click.self="nickDialog = false">
          <div class="nick-dialog">
            <h3>修改角色昵称</h3>
            <input v-model="nickDraft" class="input" maxlength="8" placeholder="最多 8 字" @keyup.enter="saveNickname" />
            <div class="nick-dialog-btns">
              <button class="btn btn-secondary" type="button" @click="nickDialog = false">取消</button>
              <button class="btn btn-primary" type="button" @click="saveNickname">保存</button>
            </div>
          </div>
        </div>

        <div class="form-card">
          <div class="lobby-body" :class="{ 'has-join': showJoin }">
            <div class="lobby-primary">
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
            </div>

            <div v-if="showJoin" class="lobby-secondary join-form">
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
const newCharDialog = ref(false)
const newCharDraft = ref('')

onMounted(() => {
  auth.fetchMe()
})

function onCharacterChange(e: Event) {
  const v = Number((e.target as HTMLSelectElement).value)
  if (!Number.isNaN(v)) auth.setSelectedCharacterId(v)
}

function openNewChar() {
  newCharDraft.value = ''
  newCharDialog.value = true
}

async function saveNewCharacter() {
  const n = newCharDraft.value.trim().slice(0, 8)
  if (!n) return
  try {
    await auth.createCharacter(n)
    newCharDialog.value = false
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '创建失败')
  }
}

function openNickEdit() {
  nickDraft.value = auth.selectedCharacter?.nickname ?? ''
  nickDialog.value = true
}

async function saveNickname() {
  const n = nickDraft.value.trim().slice(0, 8)
  if (!n || !auth.selectedCharacter) return
  try {
    await auth.updateCharacterNickname(auth.selectedCharacter.id, n)
    nickDialog.value = false
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '保存失败')
  }
}

async function deleteCurrentCharacter() {
  const c = auth.selectedCharacter
  if (!c || auth.characters.length <= 1) return
  if (!confirm(`确定删除角色「${c.nickname}」？存档将一并删除。`)) return
  try {
    await auth.deleteCharacter(c.id)
  } catch (e: unknown) {
    alert(e instanceof Error ? e.message : '删除失败')
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
  if (!auth.selectedCharacterId) {
    alert('请先创建或选择一个角色')
    return
  }
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
  if (!auth.selectedCharacterId) {
    alert('请先创建或选择一个角色')
    return
  }
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
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;
  overflow-y: auto;
}

.home-bg {
  width: 100%;
  min-height: 100%;
  background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 3vh, 32px) clamp(12px, 3vw, 40px);
  box-sizing: border-box;
}

.home-content {
  text-align: center;
  width: 100%;
  max-width: min(1320px, 100%);
  margin: 0 auto;
}

.game-title {
  font-size: clamp(48px, 8vw, 76px);
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
  margin: 0;
  letter-spacing: 12px;
  line-height: 1.1;
}

.game-subtitle {
  color: rgba(255, 215, 0, 0.55);
  letter-spacing: 6px;
  font-size: clamp(15px, 2.4vw, 19px);
  margin: 10px 0 28px;
  font-weight: 500;
}

.account-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
  padding: 16px 18px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 215, 0, 0.22);
  border-radius: 12px;
  text-align: left;
}
.account-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  font-size: 16px;
  color: #d8d8e8;
}
.account-user {
  color: #ffd700;
  font-weight: 700;
  font-size: 17px;
}
.char-label {
  display: inline;
  color: #9aa0b4;
  font-size: 15px;
  margin-left: 2px;
}
.char-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.28);
  background: rgba(0, 0, 0, 0.4);
  color: #f0f0f5;
  font-size: 16px;
  max-width: 160px;
}
.char-select:focus {
  outline: none;
  border-color: #ffd700;
}
.account-meta {
  color: #b8bdd0;
  font-size: 16px;
  font-weight: 500;
}
.account-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
.link-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #5dade2;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.link-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}
.link-btn.logout {
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.35);
}
.link-btn.danger {
  color: #e67e22;
  border-color: rgba(230, 126, 34, 0.35);
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
  border-radius: 14px;
  padding: 22px;
  width: 90%;
  max-width: 360px;
}
.nick-dialog h3 {
  margin: 0 0 14px;
  color: #ffd700;
  font-size: 19px;
  font-weight: 700;
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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: clamp(24px, 3vw, 40px);
  backdrop-filter: blur(12px);
}

.lobby-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  text-align: left;
}

.lobby-body .lobby-primary {
  text-align: center;
}

@media (min-width: 900px) {
  .lobby-body.has-join {
    flex-direction: row;
    align-items: stretch;
    gap: clamp(20px, 3vw, 40px);
  }
  .lobby-body.has-join .lobby-primary {
    flex: 0 0 min(400px, 38%);
    text-align: center;
  }
  .lobby-body.has-join .lobby-secondary {
    flex: 1;
    min-width: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding-left: clamp(20px, 3vw, 36px);
    margin-top: 0;
    padding-top: 0;
  }
}

.input-group {
  margin-bottom: 18px;
  text-align: left;
}

.input-group label {
  display: block;
  color: #c4c8d8;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #fff;
  font-size: 17px;
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
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
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

@media (min-width: 900px) {
  .lobby-body.has-join .join-form {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
}

.room-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.room-list-header label {
  display: block;
  color: #c4c8d8;
  font-size: 16px;
  font-weight: 600;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c8c8d8;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffd700;
}

.no-rooms {
  text-align: center;
  color: #8a90a4;
  padding: 22px 0;
  font-size: 16px;
}

.room-list {
  max-height: min(320px, 42vh);
  overflow-y: auto;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (min-width: 720px) {
  .room-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    max-height: min(380px, 48vh);
  }
}

@media (min-width: 1100px) {
  .room-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    max-height: min(420px, 52vh);
  }
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
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
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.04em;
}

.room-host {
  color: #a8b0c4;
  font-size: 14px;
}

.room-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.room-count {
  color: #c4c8d8;
  font-size: 15px;
  font-weight: 600;
}

.room-tag {
  font-size: 12px;
  padding: 3px 10px;
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
  padding: 6px 16px;
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  color: #1a1a3e;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
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
  color: #7a8194;
  font-size: 14px;
}

.btn-block {
  flex: unset;
  width: 100%;
  margin-top: 10px;
}
</style>
