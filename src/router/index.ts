import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/room/:id',
      name: 'room',
      component: () => import('../views/RoomView.vue'),
    },
    {
      path: '/game/:id',
      name: 'game',
      component: () => import('../views/GameView.vue'),
    },
  ],
})

export default router
