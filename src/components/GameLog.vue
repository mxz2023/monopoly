<template>
  <div class="game-log">
    <h4 class="log-title">游戏日志</h4>
    <div ref="logContainer" class="log-list">
      <div
        v-for="(log, idx) in logs"
        :key="idx"
        class="log-entry"
        :class="'log-' + log.type"
      >
        <span class="log-time">{{ log.time }}</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { LogEntry } from '../types'

const props = defineProps<{
  logs: LogEntry[]
}>()

const logContainer = ref<HTMLElement | null>(null)

watch(() => props.logs.length, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
})
</script>

<style scoped>
.game-log {
  width: 220px;
  background: rgba(20, 20, 40, 0.95);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.log-title {
  color: rgba(255, 215, 0, 0.8);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 8px;
}

.log-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.log-entry {
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.03);
}

.log-time {
  color: #666;
  margin-right: 6px;
}

.log-message {
  color: #aaa;
}

.log-buy .log-message { color: #2ecc71; }
.log-rent .log-message { color: #e67e22; }
.log-pay .log-message { color: #e74c3c; }
.log-card .log-message { color: #3498db; }
.log-jail .log-message { color: #9b59b6; }
.log-bankrupt .log-message { color: #e74c3c; font-weight: bold; }
.log-info .log-message { color: #ccc; }
</style>
