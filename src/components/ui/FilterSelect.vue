<template>
  <!-- Native <select> laid over the visual label: keyboard and mobile pickers for free -->
  <span class="filter-select">
    <span class="filter-select__value" aria-hidden="true">
      {{ prefix }}{{ selectedLabel }}
      <img v-if="chevron" :src="chevronIcon" alt="" width="16" height="16" />
    </span>
    <select v-model="model" class="filter-select__native" :aria-label="label">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import chevronIcon from '@/assets/icons/chevron-down.svg'

export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    label: string
    options: SelectOption[]
    /** Text shown before the selected label, e.g. « Trier : » */
    prefix?: string
    chevron?: boolean
  }>(),
  { prefix: '', chevron: false },
)

const model = defineModel<string>({ required: true })

const selectedLabel = computed(
  () => props.options.find((option) => option.value === model.value)?.label ?? '',
)
</script>

<style scoped lang="scss">
.filter-select {
  position: relative;
  display: inline-flex;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  background: var(--color-white);

  &:hover {
    background: var(--color-gray-50);
  }

  &:focus-within {
    @include focus-ring;
  }

  &__value {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 13px;
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
    white-space: nowrap;
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
