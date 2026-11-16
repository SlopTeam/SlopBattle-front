<template>
  <!-- Not designed yet: sober centered card, shared by login and register -->
  <section class="auth">
    <form class="auth__card" novalidate @submit.prevent="emit('submit')">
      <header class="auth__header">
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </header>

      <BaseAlert v-if="error" :message="error" />

      <div class="auth__fields">
        <slot />
      </div>

      <BaseButton
        class="auth__submit"
        type="submit"
        :label="submitLabel"
        :disabled="pending"
        :aria-busy="pending"
      />

      <footer v-if="$slots.footer" class="auth__footer">
        <slot name="footer" />
      </footer>
    </form>
  </section>
</template>

<script setup lang="ts">
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps<{
  title: string
  subtitle: string
  submitLabel: string
  /** Disables the submit button while the request runs */
  pending?: boolean
  /** Form-level error, e.g. wrong credentials */
  error?: string
}>()

const emit = defineEmits<{ submit: [] }>()
</script>

<style scoped lang="scss">
.auth {
  display: flex;
  justify-content: center;
  padding: 64px 32px;

  @include small-screen {
    padding: 32px 16px;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
    max-width: 420px;
    padding: 32px;
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-xl);
    background: var(--color-white);

    @include small-screen {
      padding: 24px 16px;
    }
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: 6px;

    h1,
    p {
      margin: 0;
    }

    h1 {
      font-size: 24px;
      font-weight: var(--font-weight-bold);
    }

    p {
      color: var(--color-gray-500);
      font-size: 14px;
    }
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__submit {
    width: 100%;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 20px;
    border-top: 1px solid var(--color-gray-200);
    color: var(--color-gray-500);
    font-size: 13px;
    text-align: center;

    :deep(p) {
      margin: 0;
    }

    :deep(a) {
      color: var(--color-gray-900);
      font-weight: var(--font-weight-semibold);
    }

    :deep(code) {
      padding: 1px 4px;
      border-radius: var(--radius-sm);
      background: var(--color-gray-100);
      color: var(--color-gray-700);
    }
  }
}
</style>
