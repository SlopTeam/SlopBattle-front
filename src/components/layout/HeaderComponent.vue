<template>
  <header class="header">
    <router-link :to="{ name: 'home' }" class="brand">
      <span class="brand__logo"><img :src="walletCardsIcon" alt="" width="20" height="20" /></span>
      <span class="brand__text">
        <strong>Slop battle</strong>
        <span>TCG</span>
      </span>
    </router-link>

    <nav class="actions" aria-label="Navigation principale">
      <BaseButton :to="{ name: 'catalogue' }" label="Catalogue" variant="secondary" size="sm" />
      <BaseButton
        :to="{ name: 'booster_list' }"
        label="Ouvrir un booster"
        variant="secondary"
        size="sm"
      />

      <div ref="profileMenu" class="profile">
        <button
          type="button"
          class="profile__toggle"
          aria-label="Profil"
          aria-haspopup="true"
          :aria-expanded="menuOpen"
          aria-controls="profile-menu"
          @click="menuOpen = !menuOpen"
        >
          <img :src="userIcon" alt="" width="20" height="20" />
        </button>
        <ul v-show="menuOpen" id="profile-menu" class="profile__menu">
          <li><router-link :to="{ name: 'collection_list' }">Ma collection</router-link></li>
          <li><router-link :to="{ name: 'profile' }">Mon compte</router-link></li>
          <li><router-link :to="{ name: 'settings' }">Paramètres</router-link></li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import walletCardsIcon from '@/assets/icons/wallet-cards.svg'
import userIcon from '@/assets/icons/user.svg'

const menuOpen = ref(false)
const profileMenu = useTemplateRef('profileMenu')
const route = useRoute()

// Close the menu after navigating
watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)

// Clicks elsewhere on the page never reach the toggle button: only a listener on
// `document` sees them. Clicks inside the profile block (toggle, links) are ignored.
function onClickOutside(event: MouseEvent) {
  if (!profileMenu.value?.contains(event.target as Node)) menuOpen.value = false
}
// Escape closes the menu wherever the focus is
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}

// TODO(a11y): return focus to the toggle on Escape, close on focusout (tabbing away),
// and drop aria-haspopup (it announces an arrow-key ARIA menu; this is a disclosure).
// Listening in capture phase would also survive a stopPropagation() elsewhere.

// `document` outlives this component: the listeners must be removed on unmount,
// otherwise each remount stacks a duplicate pointing to a dead instance (memory leak)
onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped lang="scss">
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 32px;
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-white);

  @include small-screen {
    flex-wrap: wrap;
    padding: 16px;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--color-brand);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    white-space: nowrap;

    strong {
      font-size: 18px;
      font-weight: var(--font-weight-bold);
    }

    span {
      color: var(--color-gray-500);
      font-size: 12px;
    }
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile {
  position: relative;

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-md);
    background: var(--color-white);
    cursor: pointer;

    &:hover {
      background: var(--color-gray-50);
    }
  }

  // Not designed yet: sober dropdown
  &__menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 10;
    min-width: 180px;
    margin: 0;
    padding: 6px;
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-md);
    background: var(--color-white);
    box-shadow: 0 8px 24px -4px rgb(17 24 39 / 12%);
    list-style: none;

    a {
      display: block;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      color: var(--color-gray-900);
      font-size: 13px;
      font-weight: var(--font-weight-medium);
      text-decoration: none;

      &:hover,
      &.router-link-active {
        background: var(--color-gray-100);
      }
    }
  }
}
</style>
