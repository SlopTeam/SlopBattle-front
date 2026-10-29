<template>
  <component
    :is="to ? RouterLink : 'button'"
    class="button"
    :class="[`button--${variant}`, `button--${size}`]"
    :to="to"
    :type="to ? undefined : type"
  >
    <slot>{{ label }}</slot>
  </component>
</template>

<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    label?: string
    variant?: 'primary' | 'secondary' | 'free'
    /** md = Figma « UI / Button », sm = header & filters, xs = pagination */
    size?: 'md' | 'sm' | 'xs'
    /** Renders a router link instead of a button */
    to?: RouteLocationRaw
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)
</script>

<style scoped lang="scss">
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  line-height: normal;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--md {
    padding: 11px 19px;
    font-size: 14px;
  }

  &--sm {
    padding: 9px 13px;
    font-size: 13px;
  }

  &--xs {
    padding: 7px 11px;
    font-size: 13px;
  }

  &--primary {
    background: var(--color-brand);
    color: var(--color-white);

    &:hover:not(:disabled) {
      filter: brightness(0.92);
    }
  }

  &--secondary {
    border-color: var(--color-gray-200);
    background: var(--color-white);
    color: var(--color-gray-900);

    &:hover:not(:disabled) {
      background: var(--color-gray-50);
    }
  }

  &--free {
    border-color: var(--color-success-border);
    background: var(--color-success-bg);
    color: var(--color-success-text);

    &:hover:not(:disabled) {
      filter: brightness(0.97);
    }
  }
}
</style>
