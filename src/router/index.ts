import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
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
    // Return point of the Google sign-in (the token comes in the URL fragment)
    {
      path: '/auth/callback',
      name: 'auth_callback',
      component: () => import('@/views/auth/AuthCallbackView.vue'),
    },
    {
      path: '/choose-username',
      name: 'choose_username',
      component: () => import('@/views/auth/ChooseUsernameView.vue'),
      meta: { requiresAuth: true },
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

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  // Wait for the session restoration so a reload does not look like a logged-out visit
  await auth.init()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (auth.needsUsername && to.name !== 'choose_username') {
    return {
      name: 'choose_username',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
    }
  }
  if (to.name === 'choose_username' && auth.isAuthenticated && !auth.needsUsername) {
    return { name: 'home' }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }
})

/** Sends the user to the login page when the session ends (token expired) on a page that needs it */
export function redirectOnSessionExpiry(): void {
  const auth = useAuthStore()
  watch(
    () => auth.sessionExpired,
    (expired) => {
      if (!expired) return
      auth.sessionExpired = false
      const current = router.currentRoute.value
      if (current.meta.requiresAuth) {
        router.replace({ name: 'login', query: { redirect: current.fullPath } })
      }
    },
  )
}

export default router
