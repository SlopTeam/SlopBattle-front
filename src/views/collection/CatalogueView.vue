<template>
  <CardBrowser
    title="Liste des cartes"
    subtitle="Gérez votre collection, filtrez et exportez vos cartes."
    :cards="catalogueCards"
  />
</template>

<script setup lang="ts">
import CardBrowser from '@/components/collection/CardBrowser.vue'
import { catalogueCards } from '@/mocks/cards'
</script>
