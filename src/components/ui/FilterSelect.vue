<template>
  <label class="filter-select">
    <span class="filter-select__label">{{ label }}</span>
    <!-- Native <select> laid over the visual value: keyboard and mobile pickers for free -->
    <span class="filter-select__field">
      <span class="filter-select__value" aria-hidden="true">
        <span
          class="filter-select__text"
          :class="{ 'filter-select__text--placeholder': !selectedLabel }"
        >
          {{ selectedLabel || placeholder }}
        </span>
        <img :src="chevronIcon" alt="" width="16" height="16" />
      </span>
      <select v-model="model" class="filter-select__native" :title="selectedLabel">
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import chevronIcon from '@/assets/icons/chevron-down.svg'

export interface SelectOption {
  value: string
  label: string
}

const props = defineProps<{
  label: string
  options: SelectOption[]
  /** Hint shown while no filter is selected */
  placeholder?: string
}>()

const model = defineModel<string>({ required: true })

// The empty-value option means « no filter »: it stays in the list to reset, but the field shows empty
const selectedLabel = computed(() =>
  model.value === ''
    ? ''
    : (props.options.find((option) => option.value === model.value)?.label ?? ''),
)
</script>

<style scoped lang="scss">
.filter-select {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  width: 180px;
  max-width: 100%;

  &__label {
    @include field-label;
  }

  &__field {
    @include field-box;
    position: relative;
    display: flex;

    &:hover {
      background: var(--color-gray-50);
    }

    &:focus-within {
      @include focus-ring;
    }
  }

  &__value {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 0 13px;
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
  }

  &__text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--placeholder {
      color: var(--color-gray-400);
      font-weight: var(--font-weight-regular);
    }
  }

  &__native {
    position: absolute;
    inset: 0;
    width: 100%;
    opacity: 0;
    cursor: pointer;
  }
}
</style>
