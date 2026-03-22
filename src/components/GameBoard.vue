<template>
  <div class="game-board">
    <!-- 棋盘网格 -->
    <div class="board-grid">
      <template v-for="pos in TOTAL_CELLS" :key="pos - 1">
        <div
          class="cell-wrapper"
          :style="getCellGridStyle(pos - 1)"
          :class="{ 'is-corner': isCorner(pos - 1) }"
        >
          <div class="cell" @click="$emit('cellClick', pos - 1)">
            <div
              v-if="getCellColor(pos - 1)"
              class="cell-color-bar"
              :style="{ background: getCellColor(pos - 1) }"
            />
            <div class="cell-name">{{ getCellName(pos - 1) }}</div>
            <div v-if="getCellPrice(pos - 1)" class="cell-price">{{ getCellPrice(pos - 1) }}</div>
            <div v-if="getHouses(pos - 1)" class="cell-houses">
              {{ getHouses(pos - 1) }}
            </div>
            <div v-if="getOwnerColor(pos - 1)" class="cell-owner-dot" :style="{ background: getOwnerColor(pos - 1) }" />
          </div>
          <!-- 玩家棋子 -->
          <div class="tokens">
            <div
              v-for="player in getPlayersAtPos(pos - 1)"
              :key="player.id"
              class="player-token"
              :style="{ '--player-color': PLAYER_COLORS[(player.id - 1) % PLAYER_COLORS.length] }"
            >
              {{ player.avatar }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 中心区域 -->
    <div class="board-center">
      <div class="center-title">大富翁</div>
      <div class="center-subtitle">MONOPOLY</div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player, Property } from '../types'
import { PLAYER_COLORS } from '../types'
import { BOARD_SIZE, TOTAL_CELLS } from '../data/map'

const props = defineProps<{
  players: Player[]
  properties: Property[]
}>()

defineEmits<{
  cellClick: [position: number]
}>()

const SIDE = BOARD_SIZE - 1 // 13 cells per side
const CORNERS = [0, SIDE, SIDE * 2, SIDE * 3] // 0, 13, 26, 39

function isCorner(pos: number): boolean {
  return CORNERS.includes(pos)
}

function getCellGridStyle(pos: number): Record<string, string> {
  let row: number, col: number
  const sideLen = SIDE // 13

  if (pos <= sideLen) {
    // 底边 (右→左): row=13, col=13-pos
    row = sideLen; col = sideLen - pos
  } else if (pos <= sideLen * 2) {
    // 左边 (下→上): row=13-(pos-sideLen), col=0
    row = sideLen - (pos - sideLen); col = 0
  } else if (pos <= sideLen * 3) {
    // 顶边 (左→右): row=0, col=pos-sideLen*2
    row = 0; col = pos - sideLen * 2
  } else {
    // 右边 (上→下): row=pos-sideLen*3, col=13
    row = pos - sideLen * 3; col = sideLen
  }

  return { gridRow: `${row + 1} / ${row + 2}`, gridColumn: `${col + 1} / ${col + 2}` }
}

function getCellColor(pos: number): string {
  const prop = props.properties[pos]
  if (!prop || prop.type === 'corner' || prop.type === 'chance' || prop.type === 'chest' || prop.type === 'tax') return ''
  if (prop.type === 'railroad') return '#555'
  if (prop.type === 'utility') return '#aaa'
  return prop.color
}

function getCellName(pos: number): string {
  const prop = props.properties[pos]
  return prop?.name ?? ''
}

function getCellPrice(pos: number): string {
  const prop = props.properties[pos]
  if (!prop || prop.type === 'corner' || prop.type === 'chance' || prop.type === 'chest' || prop.type === 'tax') return ''
  if (prop.ownerId !== null) {
    return prop.mortgage ? '抵押' : `${prop.rent[0]}+`
  }
  return `$${prop.price}`
}

function getHouses(pos: number): string {
  const prop = props.properties[pos]
  if (!prop || prop.type !== 'property') return ''
  if (prop.hotel) return '🏨'
  if (prop.houses > 0) return '🏠'.repeat(prop.houses)
  return ''
}

function getOwnerColor(pos: number): string {
  const prop = props.properties[pos]
  if (!prop || prop.ownerId === null || prop.type === 'corner') return ''
  return PLAYER_COLORS[(prop.ownerId - 1) % PLAYER_COLORS.length]
}

function getPlayersAtPos(pos: number): Player[] {
  return props.players.filter(p => p.position === pos && p.status !== 'bankrupt')
}
</script>

<style scoped>
.game-board {
  width: min(92vh, 92vw);
  height: min(92vh, 92vw);
  position: relative;
  margin: 0 auto;
}

.board-grid {
  display: grid;
  grid-template-columns: 70px repeat(12, 1fr) 70px;
  grid-template-rows: 70px repeat(12, 1fr) 70px;
  width: 100%;
  height: 100%;
  gap: 1px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  overflow: hidden;
}

.cell-wrapper {
  position: relative;
  background: rgba(20, 20, 40, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  overflow: hidden;
}

.cell-wrapper:hover {
  background: rgba(40, 40, 80, 0.9);
}

.is-corner .cell {
  flex-direction: column;
  gap: 2px;
}

.cell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1px;
  position: relative;
}

.cell-color-bar {
  position: absolute;
  width: 100%;
  height: 6px;
  top: 0;
  left: 0;
  opacity: 0.9;
}

/* For vertical side cells (left column), color bar on the left */
.cell-wrapper[style*="column: 1 /"] .cell-color-bar {
  width: 6px;
  height: 100%;
  top: 0;
  left: 0;
}

.cell-name {
  font-size: 8px;
  color: #ddd;
  text-align: center;
  line-height: 1.15;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  white-space: nowrap;
}

.cell-price {
  font-size: 7px;
  color: #ffd700;
  margin-top: 1px;
}

.cell-houses {
  font-size: 7px;
  margin-top: 1px;
}

.cell-owner-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.tokens {
  position: absolute;
  bottom: 1px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1px;
  z-index: 10;
}

.player-token {
  font-size: 12px;
  filter: drop-shadow(0 0 3px var(--player-color));
  transition: transform 0.3s;
}

.board-center {
  position: absolute;
  top: 70px;
  left: 70px;
  right: 70px;
  bottom: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.center-title {
  font-size: 36px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  letter-spacing: 8px;
}

.center-subtitle {
  font-size: 14px;
  color: rgba(255, 215, 0, 0.6);
  letter-spacing: 6px;
  margin-top: 4px;
}

/* Corner cells */
.is-corner {
  background: rgba(30, 30, 60, 0.9);
}

.is-corner .cell-name {
  font-size: 9px;
  font-weight: bold;
  color: #fff;
}
</style>
