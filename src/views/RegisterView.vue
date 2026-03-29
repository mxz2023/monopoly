<template>
  <div class="auth-view">
    <div class="auth-bg">
      <div class="auth-card">
        <h1 class="title">注册</h1>
        <p class="subtitle">设置登录用户名与游戏中显示的昵称（进入房间时使用）</p>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <div class="input-group">
          <label>用户名</label>
          <input v-model="username" class="input" type="text" autocomplete="username" placeholder="3–20 位小写字母、数字或下划线" @keyup.enter="submit" />
        </div>
        <div class="input-group">
          <label>密码</label>
          <input v-model="password" class="input" type="password" autocomplete="new-password" placeholder="至少 6 位" @keyup.enter="submit" />
        </div>
        <div class="input-group">
          <label>游戏昵称</label>
          <input v-model="nickname" class="input" type="text" maxlength="8" placeholder="最多 8 个字" @keyup.enter="submit" />
        </div>

        <button class="btn btn-primary" :disabled="loading" @click="submit">
          {{ loading ? '注册中…' : '注册并登录' }}
        </button>
        <p class="footer-link">
          已有账号？
          <router-link to="/login">登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const nickname = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!nickname.value.trim()) {
    error.value = '请填写昵称'
    return
  }
  loading.value = true
  try {
    await auth.register(username.value.trim().toLowerCase(), password.value, nickname.value.trim())
    router.replace('/')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-view {
  width: 100vw;
  min-height: 100vh;
  background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.auth-bg {
  width: 100%;
  max-width: 420px;
}
.auth-card {
  background: rgba(20, 20, 45, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.25);
  border-radius: 16px;
  padding: 32px;
}
.title {
  color: #ffd700;
  font-size: 28px;
  margin: 0 0 8px;
  text-align: center;
}
.subtitle {
  color: #888;
  font-size: 13px;
  text-align: center;
  margin: 0 0 24px;
  line-height: 1.5;
}
.error-msg {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
}
.input-group {
  margin-bottom: 16px;
}
.input-group label {
  display: block;
  color: #aaa;
  font-size: 12px;
  margin-bottom: 6px;
}
.input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.35);
  color: #eee;
  font-size: 15px;
}
.input:focus {
  outline: none;
  border-color: rgba(255, 215, 0, 0.5);
}
.btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}
.btn-primary {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: #fff;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.footer-link {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-top: 20px;
}
.footer-link a {
  color: #3498db;
  text-decoration: none;
}
.footer-link a:hover {
  text-decoration: underline;
}
</style>
