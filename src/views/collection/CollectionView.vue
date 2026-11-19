<template>
  <CardBrowser
    v-model:filters="filters"
    v-model:sort="sort"
    v-model:page="page"
    v-model:page-size="pageSize"
    title="Ma collection"
    subtitle="Gérez votre collection, filtrez et exportez vos cartes."
    :cards="pageCards"
    :total="filtered.length"
    :page-count="pageCount"
    :group-filter="setFilter"
    :type-options="toOptions(types)"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import CardBrowser, { type GroupFilter } from '@/components/collection/CardBrowser.vue'
import type { SelectOption } from '@/components/ui/FilterSelect.vue'
import { useCardFilters } from '@/composables/useCardFilters'
import { collectionCards } from '@/mocks/cards'

const pageSize = ref(12)
const { filters, sort, page, sets, types, filtered, pageCards, pageCount } = useCardFilters(
  collectionCards,
  pageSize,
)

function toOptions(values: string[]): SelectOption[] {
  return values.map((value) => ({ value, label: value }))
}

const setFilter = computed<GroupFilter>(() => ({
  label: 'Édition',
  placeholder: 'Choisir une édition',
  allLabel: 'Toutes les éditions',
  options: toOptions(sets.value),
}))
</script>
