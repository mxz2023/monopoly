<template>
  <div class="player-panel">
    <h3 class="panel-title">玩家列表</h3>
    <div
      v-for="player in players"
      :key="player.id"
      class="player-card"
      :class="{
        'is-current': player.id === players[currentPlayerIndex]?.id,
        'is-me': player.id === myId,
        'is-bankrupt': player.status === 'bankrupt',
        'is-jail': player.inJail,
      }"
    >
      <div class="player-header">
        <span class="player-avatar">{{ player.avatar }}</span>
        <span class="player-name">{{ player.name }}</span>
        <span v-if="player.id === myId" class="me-badge">我</span>
        <span v-if="player.inJail" class="jail-badge"> Prison </span>
        <span v-if="player.status === 'bankrupt'" class="bankrupt-badge"> 破产 </span>
      </div>
      <div class="player-money">${{ player.money.toLocaleString() }}</div>
      <div class="player-properties">
        <div
          v-for="prop in playerProperties(player.id)"
          :key="prop.id"
          class="mini-prop"
          :style="{ background: prop.color || '#555' }"
          :title="prop.name"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player, Property } from '../types'

defineProps<{
  players: Player[]
  properties: Property[]
  currentPlayerIndex: number
  myId: number
}>()

function playerProperties(playerId: number): Property[] {
  return [] // Will be handled by parent via computed
}
</script>

<style scoped>
.player-panel {
  width: 200px;
  background: rgba(20, 20, 40, 0.95);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  max-height: 100%;
  overflow-y: auto;
}

.panel-title {
  color: #ffd700;
  font-size: 14px;
  margin: 0 0 10px;
  text-align: center;
  letter-spacing: 2px;
}

.player-card {
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.player-card.is-current {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
}

.player-card.is-me {
  border-color: rgba(100, 200, 255, 0.5);
}

.player-card.is-bankrupt {
  opacity: 0.4;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.player-avatar {
  font-size: 18px;
}

.player-name {
  color: #ddd;
  font-size: 12px;
  font-weight: 500;
}

.me-badge {
  background: #3498db;
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
}

.jail-badge {
  background: #e67e22;
  color: #fff;
  font-size: 9px;
  padding: 1px 3px;
  border-radius: 3px;
}

.bankrupt-badge {
  background: #e74c3c;
  color: #fff;
  font-size: 9px;
  padding: 1px 3px;
  border-radius: 3px;
}

.player-money {
  color: #2ecc71;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.player-properties {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}

.mini-prop {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  opacity: 0.8;
}
</style>
