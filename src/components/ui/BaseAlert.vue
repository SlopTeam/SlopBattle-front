<template>
  <p class="alert" :class="`alert--${variant}`" :role="variant === 'error' ? 'alert' : 'status'">
    <slot>{{ message }}</slot>
  </p>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string
    variant?: 'error' | 'success'
  }>(),
  { variant: 'error' },
)
</script>

<style scoped lang="scss">
.alert {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: var(--radius-md);
  font-size: 13px;

  &--error {
    border-color: var(--color-error-border);
    background: var(--color-error-bg);
    color: var(--color-error-text);
  }

  &--success {
    border-color: var(--color-success-border);
    background: var(--color-success-bg);
    color: var(--color-success-text);
  }
}
</style>
