<template>
  <span class="tag" :class="`tag--${kind}`">{{ label }}</span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label: string; kind?: 'type' | 'category' }>(), { kind: 'type' })
</script>

<style scoped lang="scss">
.tag {
  display: inline-flex;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  white-space: nowrap;

  &--type {
    border-radius: var(--radius-sm);
    background: var(--color-gray-100);
    color: var(--color-gray-700);
  }

  &--category {
    border: 1px solid var(--color-gray-300);
    border-radius: var(--radius-pill);
    color: var(--color-gray-500);
  }
}
</style>
