<template>
  <AuthForm
    title="Connexion"
    subtitle="Connectez-vous pour retrouver votre collection."
    :submit-label="pending ? 'Connexion…' : 'Se connecter'"
    :pending="pending"
    :error="formError"
    @submit="submit"
  >
    <TextField
      v-model="email"
      label="Email"
      type="email"
      autocomplete="email"
      :error="errors.email"
    />
    <TextField
      v-model="password"
      label="Mot de passe"
      type="password"
      autocomplete="current-password"
      :error="errors.password"
    />

    <template #footer>
      <p>
        Pas encore de compte ?
        <router-link :to="{ name: 'register', query: route.query }">Créer un compte</router-link>
      </p>
      <!-- TODO : remove with the mocked back-end -->
      <p>
        Compte de démo : <code>{{ DEMO_ACCOUNT.email }}</code> /
        <code>{{ DEMO_ACCOUNT.password }}</code>
      </p>
    </template>
  </AuthForm>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AuthForm from '@/components/auth/AuthForm.vue'
import TextField from '@/components/ui/TextField.vue'
import { useAuthRedirect } from '@/composables/useAuthRedirect'
import { DEMO_ACCOUNT } from '@/mocks/users'
import { AuthError, useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const redirectAfterAuth = useAuthRedirect()

const email = ref('')
const password = ref('')
const errors = ref<{ email?: string; password?: string }>({})
const formError = ref('')
const pending = ref(false)

function validate() {
  return {
    email: email.value.trim() ? undefined : 'Saisissez votre email.',
    password: password.value ? undefined : 'Saisissez votre mot de passe.',
  }
}

async function submit() {
  formError.value = ''
  errors.value = validate()
  if (errors.value.email || errors.value.password) return

  pending.value = true
  try {
    await auth.login(email.value, password.value)
    await redirectAfterAuth()
  } catch (error) {
    formError.value =
      error instanceof AuthError ? error.message : 'Une erreur est survenue, réessayez.'
  } finally {
    pending.value = false
  }
}
</script>
