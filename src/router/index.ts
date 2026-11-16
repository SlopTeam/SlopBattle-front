import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Redirects to login when logged out */
    requiresAuth?: boolean
    /** Login and register: pointless once logged in */
    guestOnly?: boolean
  }
}

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
      path: '/catalogue',
      name: 'catalogue',
      component: () => import('@/views/collection/CatalogueView.vue'),
    },
    {
      path: '/profile/collection',
      name: 'collection_list',
      component: () => import('@/views/collection/CollectionView.vue'),
      meta: { requiresAuth: true },
    },
    // Game
    {
      path: '/boosters',
      name: 'booster_list',
      component: () => import('@/views/game/BoosterListView.vue'),
    },
    // Auth
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    // Account
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/account/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/account/SettingsView.vue'),
      meta: { requiresAuth: true },
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

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

export default router
