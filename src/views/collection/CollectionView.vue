<template>
  <CardBrowser
    title="Ma collection"
    subtitle="Gérez votre collection, filtrez et exportez vos cartes."
    :cards="collectionCards"
  />
</template>

<script setup lang="ts">
import CardBrowser from '@/components/collection/CardBrowser.vue'
import { collectionCards } from '@/mocks/cards'
</script>
