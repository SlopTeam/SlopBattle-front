<template>
  <!-- Inlined so the glyph takes `currentColor` from its parent -->
  <span class="rarity-icon" aria-hidden="true" v-html="icons[rarity]"></span>
</template>

<script setup lang="ts">
import type { Rarity } from '@/constants/rarity'
import common from '@/assets/icons/rarity-common.svg?raw'
import uncommon from '@/assets/icons/rarity-uncommon.svg?raw'
import rare from '@/assets/icons/rarity-rare.svg?raw'
import epic from '@/assets/icons/rarity-epic.svg?raw'
import legendary from '@/assets/icons/rarity-legendary.svg?raw'

defineProps<{ rarity: Rarity }>()

// TODO(design): no « Goated » icon yet, the legendary one stands in
const icons: Record<Rarity, string> = { common, uncommon, rare, epic, legendary, goat: legendary }
</script>

<style scoped lang="scss">
.rarity-icon {
  display: inline-flex;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
}
</style>
