<template>
  <CardBrowser
    title="Liste des cartes"
    subtitle="Découvrez toutes les cartes du jeu et filtrez-les par édition, type ou rareté."
    :cards="catalogueCards"
  />
</template>

<script setup lang="ts">
import CardBrowser from '@/components/collection/CardBrowser.vue'
import { catalogueCards } from '@/mocks/cards'
</script>
