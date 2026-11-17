<template>
  <section class="callback">
    <BaseAlert v-if="error" :message="error" />
    <p v-else role="status">Connexion en cours…</p>
    <router-link v-if="error" :to="{ name: 'login' }">Retour à la connexion</router-link>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { takeRememberedRedirect, useAuthRedirect } from '@/composables/useAuthRedirect'
import { AuthError, useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const redirectAfterAuth = useAuthRedirect()

const error = ref('')

// The back-end sends the token back in the URL fragment: `#access_token=…`
onMounted(async () => {
  const token = new URLSearchParams(route.hash.slice(1)).get('access_token')
  const redirect = takeRememberedRedirect()

  // Keep the token out of the address bar and the history
  await router.replace({ name: 'auth_callback' })

  if (!token) {
    error.value = 'La connexion avec Google a échoué.'
    return
  }

  try {
    await auth.loginWithToken(token)
    await redirectAfterAuth(redirect)
  } catch (e) {
    error.value = e instanceof AuthError ? e.message : 'La connexion avec Google a échoué.'
  }
})
</script>

<style scoped lang="scss">
.callback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 32px;

  p {
    margin: 0;
  }
}
</style>
