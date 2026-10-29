<template>
  <div class="card-content">
    <h3 class="card-content__name">{{ name }}</h3>
    <ul class="card-content__tags" aria-label="Types">
      <li v-for="type in types" :key="type"><BaseTag :label="type" /></li>
    </ul>
    <p class="card-content__description">{{ description }}</p>
    <ul class="card-content__tags" aria-label="Catégories">
      <li v-for="category in categories" :key="category">
        <BaseTag :label="category" kind="category" />
      </li>
    </ul>
    <div class="card-content__footer">
      <span>#{{ String(id).padStart(3, '0') }}</span>
      <span class="card-content__rarity"><RarityBadge :rarity="rarity" /></span>
      <time :datetime="createdAt">{{ formattedDate }}</time>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseTag from '@/components/ui/BaseTag.vue'
import RarityBadge from '@/components/ui/RarityBadge.vue'
import type { Rarity } from '@/constants/rarity'

const props = defineProps<{
  name: string
  types: string[]
  description: string
  categories: string[]
  id: number
  /** ISO date (YYYY-MM-DD) */
  createdAt: string
  rarity: Rarity
}>()

// UTC so that a date-only ISO string never shifts to the previous day
const dateFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC' })
const formattedDate = computed(() => dateFormat.format(new Date(props.createdAt)))
</script>

<style scoped lang="scss">
.card-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 16px 16px 14px;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  background: var(--color-white);

  &__name {
    margin: 0;
    font-size: 22px;
    font-weight: var(--font-weight-bold);
    line-height: 28px;
    letter-spacing: -0.01em;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__description {
    display: -webkit-box;
    margin: 0;
    overflow: hidden;
    color: var(--color-gray-600);
    font-size: 13px;
    line-height: 19px;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  &__footer {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    align-items: center;
    gap: 8px;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid var(--color-gray-200);
    color: var(--color-gray-500);
    font-size: 11px;
    font-weight: var(--font-weight-medium);

    > :last-child {
      text-align: right;
    }
  }

  &__rarity {
    display: flex;
    justify-content: center;
  }
}
</style>
