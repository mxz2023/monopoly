<template>
  <div class="dice-container">
    <div
      v-for="(val, idx) in [dice[0], dice[1]]"
      :key="idx"
      class="die"
      :class="{ rolling: isRolling, disabled: !canRoll }"
      @click="onRoll"
    >
      <div class="die-face" :data-value="val || 1">
        <template v-if="val > 0">
          <span v-for="dot in getDots(val)" :key="dot" class="dot" :style="getDotStyle(dot, val)" />
        </template>
        <span v-else class="die-placeholder">?</span>
      </div>
    </div>
    <div v-if="isRolling" class="dice-rolling-text">掷骰中...</div>
    <div v-else-if="canRoll && dice[0] > 0 === false" class="dice-prompt">点击掷骰子</div>
    <div v-else-if="dice[0] === dice[1] && dice[0] > 0" class="dice-double">双数！再掷一次</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  dice: [number, number]
  canRoll: boolean
  inJail: boolean
}>()

const emit = defineEmits<{
  roll: []
  payJailFee: []
}>()

const isRolling = ref(false)

function onRoll() {
  if (!props.canRoll) return
  if (props.inJail) return
  isRolling.value = true
  emit('roll')
  setTimeout(() => {
    isRolling.value = false
  }, 600)
}

function getDots(value: number): number[] {
  return Array.from({ length: value }, (_, i) => i + 1)
}

function getDotStyle(dot: number, value: number): Record<string, string> {
  const positions: Record<number, Record<number, string>> = {
    1: { 1: 'top:50%;left:50%;transform:translate(-50%,-50%)' },
    2: { 1: 'top:20%;left:20%', 2: 'top:80%;left:80%' },
    3: { 1: 'top:20%;left:20%', 2: 'top:50%;left:50%;transform:translate(-50%,-50%)', 3: 'top:80%;left:80%' },
    4: { 1: 'top:20%;left:20%', 2: 'top:20%;left:80%', 3: 'top:80%;left:20%', 4: 'top:80%;left:80%' },
    5: { 1: 'top:20%;left:20%', 2: 'top:20%;left:80%', 3: 'top:50%;left:50%;transform:translate(-50%,-50%)', 4: 'top:80%;left:20%', 5: 'top:80%;left:80%' },
    6: { 1: 'top:20%;left:20%', 2: 'top:20%;left:80%', 3: 'top:50%;left:20%;transform:translateY(-50%)', 4: 'top:50%;left:80%;transform:translateY(-50%)', 5: 'top:80%;left:20%', 6: 'top:80%;left:80%' },
  }
  const style = positions[value]?.[dot] || ''
  const parts: Record<string, string> = {}
  style.split(';').filter(Boolean).forEach(s => {
    const [k, v] = s.split(':')
    if (k && v) parts[k.trim()] = v.trim()
  })
  return parts
}
</script>

<style scoped>
.dice-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.die {
  width: 56px;
  height: 56px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
}

.die:hover:not(.disabled) {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.die.disabled {
  cursor: default;
  opacity: 0.6;
}

.die.rolling {
  animation: shake 0.1s infinite;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}

.die-face {
  width: 44px;
  height: 44px;
  position: relative;
}

.dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
}

.die-placeholder {
  font-size: 20px;
  color: #999;
  font-weight: bold;
}

.dice-rolling-text {
  color: #ffd700;
  font-weight: bold;
  animation: pulse 0.5s infinite;
}

.dice-prompt {
  color: #aaa;
  font-size: 13px;
}

.dice-double {
  color: #ffd700;
  font-weight: bold;
  font-size: 13px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
