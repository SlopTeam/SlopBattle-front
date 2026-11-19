<template>
  <CardBrowser
    v-model:filters="filters"
    v-model:sort="sort"
    v-model:page="page"
    v-model:page-size="pageSize"
    title="Liste des cartes"
    subtitle="Découvrez toutes les cartes du jeu et filtrez-les par catégorie, type ou rareté."
    search-placeholder="Rechercher une carte"
    :cards="cards"
    :total="total"
    :page-count="pageCount"
    :group-filter="categoryFilter"
    :type-options="typeOptions"
    :rarity-options="rarityOptions"
    :pending="loading"
    :error="error"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getCardTypes } from '@/api/cardTypes'
import { getCategories } from '@/api/categories'
import CardBrowser, { type GroupFilter } from '@/components/collection/CardBrowser.vue'
import type { SelectOption } from '@/components/ui/FilterSelect.vue'
import { useApi } from '@/composables/useApi'
import { useCardsPage } from '@/composables/useCardsPage'

const pageSize = ref(12)
const { filters, sort, page, cards, total, pageCount, loading, error, rarities } =
  useCardsPage(pageSize)

const collator = new Intl.Collator('fr', { sensitivity: 'base' })

/** Filter options from { id, name } rows; a failure leaves the list empty, the cards show the error */
async function loadOptions(request: () => Promise<{ id: string; name: string }[]>) {
  try {
    return (await request())
      .map(({ id, name }): SelectOption => ({ value: id, label: name }))
      .sort((a, b) => collator.compare(a.label, b.label))
  } catch {
    return []
  }
}

const categories = useApi(() => loadOptions(getCategories))
const types = useApi(() => loadOptions(getCardTypes))

const categoryFilter = computed<GroupFilter>(() => ({
  label: 'Catégorie',
  placeholder: 'Choisir une catégorie',
  allLabel: 'Toutes les catégories',
  options: categories.data.value ?? [],
}))
const typeOptions = computed(() => types.data.value ?? [])
// Kept in the back's order, from the most common to the rarest
const rarityOptions = computed(() =>
  rarities.value.map(({ id, name }): SelectOption => ({ value: id, label: name })),
)
</script>
