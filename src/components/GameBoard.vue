<template>
  <div class="game-board">
    <!-- 悬停地产放大卡片（挂到 body，避免被棋盘 overflow 裁切） -->
    <Teleport to="body">
      <div
        v-if="hoveredProperty"
        class="property-hover-card"
        :style="previewCardStyle"
        role="tooltip"
      >
        <div
          class="hover-card-bar"
          :style="{ background: hoverCardAccent }"
        />
        <div class="hover-card-body">
          <div class="hover-card-title">{{ hoveredProperty.name }}</div>
          <div class="hover-card-type">{{ propertyTypeLabel(hoveredProperty) }}</div>
          <p v-if="hoveredProperty.description" class="hover-card-desc">
            {{ hoveredProperty.description }}
          </p>
          <template v-if="showPriceBlock(hoveredProperty)">
            <div class="hover-card-row">
              <span>标价</span>
              <span class="hover-card-price">${{ hoveredProperty.price.toLocaleString() }}</span>
            </div>
          </template>
          <template v-if="hoveredProperty.rent?.length && isPurchasable(hoveredProperty)">
            <div class="hover-card-rent-title">租金</div>
            <div
              v-for="(r, idx) in hoveredProperty.rent"
              :key="idx"
              class="hover-card-rent-row"
            >
              <span>{{ rentTierLabel(idx, hoveredProperty.type) }}</span>
              <span>${{ r.toLocaleString() }}</span>
            </div>
          </template>
          <div v-if="hoveredProperty.ownerId != null" class="hover-card-owner">
            <span class="owner-dot" :style="{ background: ownerDotColor(hoveredProperty.ownerId) }" />
            所有者：{{ getOwnerName(hoveredProperty.ownerId) }}
            <span v-if="hoveredProperty.mortgage" class="mortgage-tag">已抵押</span>
          </div>
          <div
            v-else-if="isPurchasable(hoveredProperty) && hoveredProperty.price"
            class="hover-card-hint"
          >
            可购买
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 棋盘网格 -->
    <div class="board-grid">
      <template v-for="pos in TOTAL_CELLS" :key="pos - 1">
        <div
          class="cell-wrapper"
          :style="getCellGridStyle(pos - 1)"
          :class="{ 'is-corner': isCorner(pos - 1), 'is-hovered': hoverCell === pos - 1 }"
          @mouseenter="onCellEnter(pos - 1, $event)"
          @mousemove="onCellMove($event)"
          @mouseleave="onCellLeave"
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
import { computed, ref } from 'vue'
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

const hoverCell = ref<number | null>(null)
const previewX = ref(0)
const previewY = ref(0)

const CARD_W = 288
const CARD_H = 320

const hoveredProperty = computed(() => {
  if (hoverCell.value === null) return null
  return props.properties[hoverCell.value] ?? null
})

const hoverCardAccent = computed(() => {
  const p = hoveredProperty.value
  if (!p) return '#ffd700'
  if (p.type === 'corner' || p.type === 'chance' || p.type === 'chest' || p.type === 'tax') {
    return 'linear-gradient(90deg, #5c6bc0, #3949ab)'
  }
  if (p.type === 'railroad') return '#546e7a'
  if (p.type === 'utility') return '#78909c'
  return p.color || '#ffd700'
})

const previewCardStyle = computed(() => ({
  left: `${previewX.value}px`,
  top: `${previewY.value}px`,
}))

function clampPreview(e: MouseEvent) {
  let x = e.clientX + 16
  let y = e.clientY + 16
  if (typeof window === 'undefined') return
  x = Math.max(8, Math.min(x, window.innerWidth - CARD_W - 8))
  y = Math.max(8, Math.min(y, window.innerHeight - CARD_H - 8))
  previewX.value = x
  previewY.value = y
}

function onCellEnter(pos: number, e: MouseEvent) {
  hoverCell.value = pos
  clampPreview(e)
}

function onCellMove(e: MouseEvent) {
  if (hoverCell.value !== null) clampPreview(e)
}

function onCellLeave() {
  hoverCell.value = null
}

function isPurchasable(p: Property): boolean {
  return (
    p.type === 'property' ||
    p.type === 'railroad' ||
    p.type === 'utility'
  )
}

function showPriceBlock(p: Property): boolean {
  return isPurchasable(p) && p.price > 0
}

function propertyTypeLabel(p: Property): string {
  switch (p.type) {
    case 'property':
      return '地产'
    case 'railroad':
      return '铁路'
    case 'utility':
      return '公共事业'
    case 'chance':
      return '机会'
    case 'chest':
      return '命运'
    case 'tax':
      return '税收'
    case 'corner':
      return '角落'
    default:
      return '格子'
  }
}

function rentTierLabel(index: number, type: Property['type']): string {
  if (type === 'railroad') {
    const n = ['', '1 条', '2 条', '3 条', '4 条']
    return n[index] ?? `等级 ${index + 1}`
  }
  if (type === 'utility') {
    return index === 0 ? '掷 1 颗骰' : '掷 2 颗骰'
  }
  const labels = ['空地', '1 房', '2 房', '3 房', '4 房', '酒店']
  return labels[index] ?? `等级 ${index + 1}`
}

function getOwnerName(ownerId: number): string {
  return props.players.find((pl) => pl.id === ownerId)?.name ?? '未知'
}

function ownerDotColor(ownerId: number): string {
  return PLAYER_COLORS[(ownerId - 1) % PLAYER_COLORS.length]
}

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
  /* 填满 .board-stage：宽高随中间栏与视口变化，不必为正方形 */
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  position: relative;
  margin: 0 auto;
  box-sizing: border-box;
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

.cell-wrapper:hover,
.cell-wrapper.is-hovered {
  background: rgba(40, 40, 80, 0.95);
  box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.35);
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
  font-size: clamp(9px, 0.85vw, 12px);
  color: #eee;
  text-align: center;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  white-space: nowrap;
  font-weight: 500;
}

.cell-price {
  font-size: clamp(8px, 0.75vw, 11px);
  color: #ffd700;
  margin-top: 1px;
  font-weight: 600;
}

.cell-houses {
  font-size: clamp(8px, 0.75vw, 11px);
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
  font-size: clamp(28px, 4.5vw, 42px);
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  letter-spacing: 8px;
}

.center-subtitle {
  font-size: clamp(13px, 1.8vw, 17px);
  color: rgba(255, 215, 0, 0.65);
  letter-spacing: 6px;
  margin-top: 6px;
  font-weight: 600;
}

/* Corner cells */
.is-corner {
  background: rgba(30, 30, 60, 0.9);
}

.is-corner .cell-name {
  font-size: clamp(10px, 0.9vw, 13px);
  font-weight: bold;
  color: #fff;
}
</style>

<style>
.property-hover-card {
  position: fixed;
  z-index: 10050;
  width: 288px;
  max-height: min(320px, 70vh);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  border-radius: 14px;
  background: linear-gradient(165deg, rgba(28, 28, 52, 0.98), rgba(14, 14, 32, 0.99));
  border: 2px solid rgba(255, 215, 0, 0.55);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 0 32px rgba(255, 215, 0, 0.12);
  animation: hover-card-in 0.12s ease-out;
}

@keyframes hover-card-in {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.property-hover-card .hover-card-bar {
  height: 10px;
  flex-shrink: 0;
}

.property-hover-card .hover-card-body {
  padding: 12px 14px 14px;
  overflow-y: auto;
  color: #e8e8f0;
}

.property-hover-card .hover-card-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  line-height: 1.25;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.property-hover-card .hover-card-type {
  font-size: 13px;
  color: rgba(255, 215, 0, 0.85);
  margin-bottom: 8px;
  letter-spacing: 0.05em;
}

.property-hover-card .hover-card-desc {
  font-size: 13px;
  line-height: 1.45;
  color: #b0b8d0;
  margin: 0 0 10px;
}

.property-hover-card .hover-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 6px;
}

.property-hover-card .hover-card-price {
  color: #2ecc71;
  font-weight: 700;
  font-size: 16px;
}

.property-hover-card .hover-card-rent-title {
  font-size: 12px;
  color: #888;
  margin: 8px 0 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.property-hover-card .hover-card-rent-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: #ccc;
}

.property-hover-card .hover-card-owner {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: #a5d6a7;
}

.property-hover-card .owner-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.property-hover-card .mortgage-tag {
  font-size: 12px;
  color: #ffab40;
  background: rgba(255, 171, 64, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
}

.property-hover-card .hover-card-hint {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(46, 204, 113, 0.95);
  font-weight: 600;
}
</style>
