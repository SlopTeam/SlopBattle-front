<template>
  <div class="text-field">
    <label class="text-field__label" :for="id">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      class="text-field__input"
      :class="{ 'text-field__input--error': error }"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error ? errorId : undefined"
    />
    <p v-if="error" :id="errorId" class="text-field__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    label: string
    type?: 'text' | 'email' | 'password'
    autocomplete?: string
    placeholder?: string
    /** Message shown under the field, and red border */
    error?: string
  }>(),
  { type: 'text' },
)

const model = defineModel<string>({ required: true })

const id = useId()
const errorId = `${id}-error`
</script>

<style scoped lang="scss">
.text-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    @include field-label;
  }

  &__input {
    @include field-box;
    padding: 0 15px;
    font-size: 14px;

    &::placeholder {
      color: var(--color-gray-400);
    }

    &--error {
      border-color: var(--color-error);
    }
  }

  &__error {
    margin: 0;
    color: var(--color-error-text);
    font-size: 12px;
  }
}
</style>
