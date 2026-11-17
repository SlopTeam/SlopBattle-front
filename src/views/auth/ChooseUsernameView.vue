<template>
  <AuthForm
    title="Choisissez votre pseudo"
    subtitle="Il sera visible par les autres joueurs. Vous en avez besoin pour continuer."
    submit-label="Valider"
    :pending="pending"
    :error="formError"
    @submit="submit"
  >
    <TextField v-model="username" label="Pseudo" autocomplete="username" :error="error" />

    <template #footer>
      <p><button type="button" class="link" @click="logout">Se déconnecter</button></p>
    </template>
  </AuthForm>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthForm from '@/components/auth/AuthForm.vue'
import TextField from '@/components/ui/TextField.vue'
import { useAuthRedirect } from '@/composables/useAuthRedirect'
import { USERNAME_MIN_LENGTH } from '@/constants/auth'
import { AuthError, useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const redirectAfterAuth = useAuthRedirect()

const username = ref('')
const error = ref<string>()
const formError = ref('')
const pending = ref(false)

async function submit() {
  formError.value = ''
  error.value =
    username.value.trim().length >= USERNAME_MIN_LENGTH
      ? undefined
      : `Le pseudo doit contenir au moins ${USERNAME_MIN_LENGTH} caractères.`
  if (error.value) return

  pending.value = true
  try {
    await auth.setUsername(username.value)
    await redirectAfterAuth()
  } catch (e) {
    formError.value = e instanceof AuthError ? e.message : 'Une erreur est survenue, réessayez.'
  } finally {
    pending.value = false
  }
}

function logout() {
  auth.logout()
  router.replace({ name: 'login' })
}
</script>

<style scoped lang="scss">
.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-gray-900);
  font: inherit;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}
</style>
