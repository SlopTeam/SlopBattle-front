<template>
  <label class="search">
    <img class="search__icon" :src="searchIcon" alt="" width="18" height="18" />
    <span class="search__label">{{ label }}</span>
    <input v-model="model" class="search__input" type="search" :placeholder="placeholder" />
  </label>
</template>

<script setup lang="ts">
import searchIcon from '@/assets/icons/search.svg'

defineProps<{ label: string; placeholder?: string }>()

const model = defineModel<string>({ required: true })
</script>

<style scoped lang="scss">
.search {
  @include field-box;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 15px;
  cursor: text;

  &:focus-within {
    @include focus-ring;
  }

  &__label {
    @include visually-hidden;
  }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    font-size: 14px;
    outline: none;

    &::placeholder {
      color: var(--color-gray-400);
    }
  }
}
</style>
