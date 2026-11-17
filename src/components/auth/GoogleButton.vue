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
import { apiUrl } from '@/api/client'
import BaseButton from '@/components/ui/BaseButton.vue'
import { rememberRedirect } from '@/composables/useAuthRedirect'

const route = useRoute()

// Full page navigation: the back-end handles the OAuth flow and sends the user back to /auth/callback
function signIn() {
  rememberRedirect(route.query.redirect)
  window.location.href = apiUrl('/auth/google')
}
</script>
