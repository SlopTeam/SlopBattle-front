<template>
  <AuthForm
    title="Créer un compte"
    subtitle="Inscrivez-vous pour ouvrir des boosters et construire votre collection."
    :submit-label="pending ? 'Création…' : 'Créer mon compte'"
    :pending="pending"
    :error="formError"
    @submit="submit"
  >
    <TextField v-model="username" label="Pseudo" autocomplete="username" :error="errors.username" />
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
      autocomplete="new-password"
      :error="errors.password"
    />
    <TextField
      v-model="confirmation"
      label="Confirmer le mot de passe"
      type="password"
      autocomplete="new-password"
      :error="errors.confirmation"
    />

    <template #footer>
      <p>
        Déjà un compte ?
        <router-link :to="{ name: 'login', query: route.query }">Se connecter</router-link>
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
import { AuthError, useAuthStore } from '@/stores/auth'

const USERNAME_MIN_LENGTH = 3
const PASSWORD_MIN_LENGTH = 8
// Loose on purpose: the back-end (or a confirmation email) is the real check
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const auth = useAuthStore()
const route = useRoute()
const redirectAfterAuth = useAuthRedirect()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmation = ref('')
const errors = ref<{ username?: string; email?: string; password?: string; confirmation?: string }>(
  {},
)
const formError = ref('')
const pending = ref(false)

function validate() {
  return {
    username:
      username.value.trim().length >= USERNAME_MIN_LENGTH
        ? undefined
        : `Le pseudo doit contenir au moins ${USERNAME_MIN_LENGTH} caractères.`,
    email: EMAIL_PATTERN.test(email.value.trim()) ? undefined : 'Saisissez un email valide.',
    password:
      password.value.length >= PASSWORD_MIN_LENGTH
        ? undefined
        : `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    confirmation:
      confirmation.value === password.value ? undefined : 'Les mots de passe ne correspondent pas.',
  }
}

async function submit() {
  formError.value = ''
  errors.value = validate()
  if (Object.values(errors.value).some(Boolean)) return

  pending.value = true
  try {
    await auth.register({
      username: username.value,
      email: email.value,
      password: password.value,
    })
    await redirectAfterAuth()
  } catch (error) {
    formError.value =
      error instanceof AuthError ? error.message : 'Une erreur est survenue, réessayez.'
  } finally {
    pending.value = false
  }
}
</script>
