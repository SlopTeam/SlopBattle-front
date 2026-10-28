<template>
  <span class="rarity-badge" :data-rarity="rarity">
    <RarityIcon :rarity="rarity" />
    {{ RARITY_LABELS[rarity] }}
  </span>
</template>

<script setup lang="ts">
import RarityIcon from '@/components/ui/RarityIcon.vue'
import { RARITY_LABELS, type Rarity } from '@/constants/rarity'

defineProps<{ rarity: Rarity }>()
</script>

<style scoped lang="scss">
.rarity-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-pill);
  background: var(--rarity-badge-bg);
  color: var(--rarity-badge-text);
  font-size: 12px;
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}
</style>
