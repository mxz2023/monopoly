<template>
  <div class="action-panel" v-if="gamePhase === 'playing'">
    <!-- 骰子区 -->
    <div class="action-section">
      <div class="section-label">骰子</div>
      <Dice
        :dice="dice"
        :canRoll="canRoll"
        :inJail="inJail"
        @roll="$emit('roll')"
      />
      <div v-if="inJail && isMyTurn" class="jail-actions">
        <button class="btn btn-warning" @click="$emit('payJailFee')">
          付 $500 出狱
        </button>
      </div>
    </div>

    <!-- 地产信息 -->
    <div class="action-section" v-if="currentProperty">
      <div class="section-label">当前位置</div>
      <div class="property-info">
        <div class="prop-name" :style="{ color: currentProperty.color || '#ddd' }">
          {{ currentProperty.name }}
        </div>
        <div class="prop-detail">
          <span v-if="currentProperty.type === 'property'">地产</span>
          <span v-else-if="currentProperty.type === 'railroad'">火车站</span>
          <span v-else-if="currentProperty.type === 'utility'">公共设施</span>
          <span v-else-if="currentProperty.type === 'chance'">机会</span>
          <span v-else-if="currentProperty.type === 'chest'">命运</span>
          <span v-else-if="currentProperty.type === 'tax'">税收</span>
          <span v-else>特殊</span>
          <span v-if="currentProperty.price"> · ${{ currentProperty.price }}</span>
        </div>
        <div v-if="currentProperty.ownerId" class="prop-owner">
          所有者: {{ ownerName }}
          <span v-if="currentProperty.mortgage"> (已抵押)</span>
          <span v-if="currentProperty.houses"> · {{ currentProperty.houses }}栋房</span>
          <span v-if="currentProperty.hotel"> · 酒店</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section" v-if="canAct">
      <div class="section-label">操作</div>
      <button
        v-if="canBuyProperty"
        class="btn btn-buy"
        @click="$emit('buyProperty')"
      >
        购买 ${{ currentProperty?.price }}
      </button>
      <button
        v-if="canBuyProperty"
        class="btn btn-skip"
        @click="$emit('skipBuy')"
      >
        跳过
      </button>
      <button class="btn btn-end" @click="$emit('endTurn')">
        结束回合
      </button>
    </div>

    <!-- 我的资产操作 -->
    <div class="action-section" v-if="canAct && myProperties.length > 0">
      <div class="section-label">我的资产</div>
      <div class="my-props">
        <div
          v-for="prop in myProperties"
          :key="prop.id"
          class="my-prop-item"
        >
          <div class="prop-color" :style="{ background: prop.color || '#555' }" />
          <div class="prop-info-mini">
            <span class="prop-name-mini">{{ prop.name }}</span>
            <span class="prop-build" v-if="prop.type === 'property'">
              {{ prop.hotel ? '🏨' : prop.houses > 0 ? '🏠' + prop.houses : '' }}
            </span>
          </div>
          <div class="prop-actions">
            <button
              v-if="prop.type === 'property' && !prop.hotel && prop.houses < 4"
              class="btn-sm btn-build"
              @click="$emit('buildHouse', prop.id)"
              title="建造房屋"
            >
              🏠
            </button>
            <button
              class="btn-sm"
              :class="prop.mortgage ? 'btn-unmortgage' : 'btn-mortgage'"
              @click="$emit('mortgage', prop.id)"
              :title="prop.mortgage ? '赎回' : '抵押'"
            >
              {{ prop.mortgage ? '💰' : '🏦' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Property } from '../types'
import Dice from './Dice.vue'

const props = defineProps<{
  gamePhase: string
  dice: [number, number]
  canRoll: boolean
  canAct: boolean
  isMyTurn: boolean
  inJail: boolean
  currentProperty: Property | null
  canBuyProperty: boolean
  myProperties: Property[]
  players: Array<{ id: number; name: string }>
}>()

const emit = defineEmits<{
  roll: []
  buyProperty: []
  skipBuy: []
  endTurn: []
  buildHouse: [propertyId: number]
  mortgage: [propertyId: number]
  payJailFee: []
}>()

const ownerName = computed(() => {
  if (!props.currentProperty?.ownerId) return ''
  return props.players.find(p => p.id === props.currentProperty!.ownerId)?.name ?? ''
})
</script>

<style scoped>
.action-panel {
  width: 198px;
  flex-shrink: 0;
  background: rgba(20, 20, 40, 0.95);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 10px 8px;
  max-height: 100%;
  overflow-y: auto;
}

.action-section {
  margin-bottom: 10px;
}

.section-label {
  color: rgba(255, 215, 0, 0.9);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.property-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 8px;
}

.prop-name {
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 2px;
  line-height: 1.2;
}

.prop-detail {
  font-size: 12px;
  color: #b8bdd0;
  line-height: 1.35;
}

.prop-owner {
  font-size: 12px;
  color: #2ecc71;
  margin-top: 2px;
  font-weight: 600;
}

.btn {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 6px;
  color: #fff;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn-buy {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
}

.btn-skip {
  background: rgba(255, 255, 255, 0.1);
}

.btn-end {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.btn-warning {
  background: linear-gradient(135deg, #e67e22, #d35400);
  font-size: 12px;
}

.jail-actions {
  margin-top: 8px;
}

.my-props {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.my-prop-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.prop-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.prop-info-mini {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prop-name-mini {
  font-size: 11px;
  font-weight: 600;
  color: #e8eaf0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
}

.prop-build {
  font-size: 10px;
}

.prop-actions {
  display: flex;
  gap: 3px;
}

.btn-sm {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-sm:hover {
  transform: scale(1.15);
}

.btn-build {
  background: rgba(46, 204, 113, 0.3);
}

.btn-mortgage {
  background: rgba(231, 76, 60, 0.3);
}

.btn-unmortgage {
  background: rgba(241, 196, 15, 0.3);
}
</style>
