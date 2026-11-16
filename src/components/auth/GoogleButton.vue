<template>
  <BaseButton
    class="google-button"
    variant="secondary"
    label="Continuer avec Google"
    @click="signIn"
  />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import { rememberRedirect } from '@/composables/useAuthRedirect'

const route = useRoute()

// Full page navigation: the back-end handles the OAuth flow and sends the user back to /auth/callback
function signIn() {
  rememberRedirect(route.query.redirect)
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`
}
</script>
