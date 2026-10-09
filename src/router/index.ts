import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Home
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    // Collection
    {
      path: '/collection',
      name: 'collection_list',
      component: () => import('@/views/collection/CollectionView.vue'),
    },
    // Game
    {
      path: '/boosters',
      name: 'booster_list',
      component: () => import('@/views/game/BoosterListView.vue'),
    },
    // Account
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/account/ProfileView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/account/SettingsView.vue'),
    },
    // System (!! Must always be at the end !!)
    {
      path: '/coming-soon',
      name: 'coming_soon',
      component: () => import('@/views/system/ComingSoonView.vue'),
    },
    {
      path: '/maintenance',
      name: 'maintenance',
      component: () => import('@/views/system/MaintenanceView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not_found',
      component: () => import('@/views/system/NotFoundView.vue'),
    },
  ],
})

export default router
