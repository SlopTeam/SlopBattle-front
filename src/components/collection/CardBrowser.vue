<template>
  <section class="browser">
    <header class="browser__title-row">
      <div class="browser__heading">
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
      <span class="browser__count">{{ formatCount(cards.length) }}</span>
    </header>

    <div class="browser__controls">
      <SearchInput
        v-model="filters.query"
        class="browser__search"
        label="Rechercher"
        placeholder="Rechercher une carte, un set ou un type"
      />
      <div class="browser__filters">
        <FilterSelect v-model="filters.set" label="Filtrer par set" :options="setOptions" />
        <FilterSelect v-model="filters.type" label="Filtrer par type" :options="typeOptions" />
        <FilterSelect
          v-model="filters.rarity"
          label="Filtrer par rareté"
          :options="rarityOptions"
        />
      </div>
      <FilterSelect
        v-model="sort"
        class="browser__sort"
        label="Trier"
        prefix="Trier : "
        chevron
        :options="sortOptions"
      />
    </div>

    <div class="panel">
      <header class="panel__header">
        <h2>Catalogue actif</h2>
        <p>Explorez les cartes en images.</p>
      </header>

      <ul v-if="pageCards.length" ref="grid" class="panel__grid">
        <li v-for="card in pageCards" :key="card.id">
          <TcgCard
            :rarity="card.rarity"
            :illustration="card.illustration"
            :name="card.name"
            :types="card.types"
            :description="card.description"
            :categories="card.categories"
            :id="card.id"
            :created-at="card.createdAt"
          />
        </li>
      </ul>
      <p v-else class="panel__empty">Aucune carte ne correspond à votre recherche.</p>

      <footer class="panel__pagination">
        <p>{{ range.from }}–{{ range.to }} sur {{ formatCount(filtered.length) }}</p>
        <div class="panel__pages">
          <BaseButton
            label="Précédent"
            variant="secondary"
            size="xs"
            :disabled="!hasPrevious"
            @click="previous"
          />
          <BaseButton label="Suivant" size="xs" :disabled="!hasNext" @click="next" />
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import TcgCard from '@/components/card/TcgCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FilterSelect, { type SelectOption } from '@/components/ui/FilterSelect.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import { useCardFilters, type CardSort } from '@/composables/useCardFilters'
import { useGridColumns } from '@/composables/useGridColumns'
import { RARITIES, RARITY_LABELS } from '@/constants/rarity'
import type { Card } from '@/types/card'

const props = defineProps<{
  title: string
  subtitle: string
  cards: Card[]
}>()

// Pages always hold complete rows, whatever the number of columns
const ROWS_PER_PAGE = 3
const columns = useGridColumns(useTemplateRef('grid'))

const {
  filters,
  sort,
  sets,
  types,
  filtered,
  pageCards,
  range,
  hasPrevious,
  hasNext,
  previous,
  next,
} = useCardFilters(
  () => props.cards,
  () => columns.value * ROWS_PER_PAGE,
)

const numberFormat = new Intl.NumberFormat('fr-FR')
function formatCount(count: number): string {
  return `${numberFormat.format(count)} ${count > 1 ? 'cartes' : 'carte'}`
}

function toOptions(allLabel: string, values: string[]): SelectOption[] {
  return [{ value: '', label: allLabel }, ...values.map((value) => ({ value, label: value }))]
}

const setOptions = computed(() => toOptions('Tous les sets', sets.value))
const typeOptions = computed(() => toOptions('Tous les types', types.value))
const rarityOptions: SelectOption[] = [
  { value: '', label: 'Toutes les raretés' },
  ...RARITIES.map((rarity) => ({ value: rarity, label: RARITY_LABELS[rarity] })),
]
const sortOptions: (SelectOption & { value: CardSort })[] = [
  { value: 'name-asc', label: 'Nom A→Z' },
  { value: 'name-desc', label: 'Nom Z→A' },
  { value: 'rarity-desc', label: 'Rareté' },
  { value: 'newest', label: 'Plus récentes' },
]
</script>

<style scoped lang="scss">
.browser {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;

  @include small-screen {
    padding: 16px;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  &__title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: 6px;

    h1 {
      font-size: 28px;
      font-weight: var(--font-weight-bold);
    }

    p {
      color: var(--color-gray-500);
      font-size: 14px;
    }
  }

  &__count {
    padding: 8px 12px;
    border-radius: var(--radius-pill);
    background: var(--color-success-bg);
    color: var(--color-success-text);
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
  }

  &__search {
    width: 420px;
    max-width: 100%;
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__sort {
    margin-left: auto;
  }
}

.panel {
  overflow: hidden;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-xl);
  background: var(--color-white);

  &__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-gray-200);
    background: var(--color-gray-50);

    h2 {
      font-size: 16px;
      font-weight: var(--font-weight-bold);
    }

    p {
      color: var(--color-gray-500);
      font-size: 13px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin: 0;
    padding: 20px;
    list-style: none;

    > li {
      display: flex;
      flex-direction: column;
    }
  }

  &__empty {
    padding: 48px 20px;
    color: var(--color-gray-500);
    font-size: 14px;
    text-align: center;
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px;
    color: var(--color-gray-500);
    font-size: 13px;
  }

  &__pages {
    display: flex;
    gap: 8px;
  }
}
</style>
