import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/room/:id',
      name: 'room',
      component: () => import('../views/RoomView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/game/:id',
      name: 'game',
      component: () => import('../views/GameView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  try {
    if (to.meta.requiresAuth) {
      if (!auth.token) {
        next({ name: 'login', query: { redirect: to.fullPath } })
        return
      }
      if (!auth.user) {
        await auth.fetchMe()
        if (!auth.user) {
          next({ name: 'login', query: { redirect: to.fullPath } })
          return
        }
      }
    }

    if (to.meta.guestOnly && auth.token) {
      await auth.fetchMe()
      if (auth.user) {
        next({ path: '/' })
        return
      }
    }
  } catch {
    if (to.meta.requiresAuth) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }

  next()
})

export default router
