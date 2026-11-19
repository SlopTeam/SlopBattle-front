<template>
  <section class="browser">
    <header class="browser__title-row">
      <div class="browser__heading">
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
      <span class="browser__count">{{ formatCount(total) }}</span>
    </header>

    <div class="browser__controls">
      <SearchInput
        v-model="filters.query"
        class="browser__search"
        label="Rechercher"
        :placeholder="searchPlaceholder"
      />
      <div class="browser__filters">
        <FilterSelect
          v-model="filters.set"
          :label="groupFilter.label"
          :placeholder="groupFilter.placeholder"
          :options="withAll(groupFilter.allLabel, groupFilter.options)"
        />
        <FilterSelect
          v-model="filters.type"
          label="Type"
          placeholder="Choisir un type"
          :options="withAll('Tous les types', typeOptions)"
        />
        <FilterSelect
          v-model="filters.rarity"
          label="Rareté"
          placeholder="Choisir une rareté"
          :options="withAll('Toutes les raretés', rarityOptions)"
        />
      </div>
      <FilterSelect v-model="sort" class="browser__sort" label="Trier par" :options="sortOptions" />
    </div>

    <div class="panel">
      <header class="panel__header">
        <h2>Catalogue actif</h2>
        <p>Explorez les cartes en images.</p>
      </header>

      <BaseAlert v-if="error" class="panel__error" :message="error" />
      <!-- Always rendered, even empty, so that its columns can be measured before the first page -->
      <ul
        ref="grid"
        class="panel__grid"
        :class="{ 'panel__grid--empty': !cards.length, 'panel__grid--pending': pending }"
        :aria-busy="pending"
      >
        <li v-for="card in cards" :key="card.id">
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
      <p v-if="!cards.length && pending" class="panel__empty" role="status">
        Chargement des cartes…
      </p>
      <p v-else-if="!cards.length && !error" class="panel__empty">
        Aucune carte ne correspond à votre recherche.
      </p>

      <footer class="panel__pagination">
        <p>{{ range.from }}–{{ range.to }} sur {{ formatCount(total) }}</p>
        <div class="panel__pages">
          <BaseButton
            label="Précédent"
            variant="secondary"
            size="xs"
            :disabled="page <= 1"
            @click="previous"
          />
          <BaseButton label="Suivant" size="xs" :disabled="page >= pageCount" @click="next" />
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watchEffect } from 'vue'
import TcgCard from '@/components/card/TcgCard.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FilterSelect, { type SelectOption } from '@/components/ui/FilterSelect.vue'
import SearchInput from '@/components/ui/SearchInput.vue'
import type { CardFilters, CardSort } from '@/composables/useCardFilters'
import { useGridColumns } from '@/composables/useGridColumns'
import { RARITIES, RARITY_LABELS } from '@/constants/rarity'
import type { Card } from '@/types/card'

/** First filter (`filters.set`): the set in the collection, the category in the catalogue */
export interface GroupFilter {
  label: string
  placeholder: string
  /** Label of the « no filter » option */
  allLabel: string
  options: SelectOption[]
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle: string
    /** Cards of the current page only */
    cards: Card[]
    /** Cards matching the filters, all pages */
    total: number
    pageCount: number
    groupFilter: GroupFilter
    typeOptions: SelectOption[]
    /** Defaults to the dev codes (`common`…), which the collection filters on */
    rarityOptions?: SelectOption[]
    searchPlaceholder?: string
    /** A page is loading: the current cards stay visible */
    pending?: boolean
    error?: string
  }>(),
  {
    searchPlaceholder: 'Rechercher une carte, une édition ou un type',
    pending: false,
    error: '',
    rarityOptions: () =>
      RARITIES.map((rarity) => ({ value: rarity, label: RARITY_LABELS[rarity] })),
  },
)

const filters = defineModel<CardFilters>('filters', { required: true })
const sort = defineModel<CardSort>('sort', { required: true })
/** 1-based */
const page = defineModel<number>('page', { required: true })
/** Set by the browser: pages always hold complete rows, whatever the number of columns */
const pageSize = defineModel<number>('pageSize', { required: true })

const ROWS_PER_PAGE = 3
const columns = useGridColumns(useTemplateRef('grid'))
watchEffect(() => {
  pageSize.value = columns.value * ROWS_PER_PAGE
})

/** 1-based range of the cards shown, e.g. { from: 13, to: 24 } */
const range = computed(() => ({
  from: props.total ? (page.value - 1) * pageSize.value + 1 : 0,
  to: Math.min(page.value * pageSize.value, props.total),
}))

function previous() {
  page.value = Math.max(1, page.value - 1)
}

function next() {
  page.value = Math.min(props.pageCount, page.value + 1)
}

const numberFormat = new Intl.NumberFormat('fr-FR')
function formatCount(count: number): string {
  return `${numberFormat.format(count)} ${count > 1 ? 'cartes' : 'carte'}`
}

function withAll(allLabel: string, options: SelectOption[]): SelectOption[] {
  return [{ value: '', label: allLabel }, ...options]
}

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
    // Filters carry a label on top: align the fields on their bottom edge
    align-items: flex-end;
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

    &--empty {
      padding: 0;
    }

    &--pending {
      opacity: 0.6;
    }
  }

  &__error {
    margin: 20px 20px 0;
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
