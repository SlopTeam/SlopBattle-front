<template>
  <Header />
  <main><router-view></router-view></main>
  <Footer />
  <CornerGifPopup />
</template>

<script setup lang="ts">
import Header from '@/components/layout/HeaderComponent.vue'
import Footer from '@/components/layout/FooterComponent.vue'
import CornerGifPopup from '@/components/layout/CornerGifPopup.vue'
</script>
