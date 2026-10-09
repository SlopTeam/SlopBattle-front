<template>
  <Header />
  <main><router-view></router-view></main>
  <Footer />
</template>

<script setup lang="ts">
import Header from '@/components/layout/HeaderComponent.vue'
import Footer from '@/components/layout/FooterComponent.vue'
</script>
