<template>
  <!-- showModal() handles the backdrop, Escape, the focus trap and initial focus (close button) -->
  <dialog
    ref="dialog"
    class="popup"
    aria-label="Surprise"
    @close="open = false"
    @click="onDialogClick"
  >
    <div class="popup__content">
      <button type="button" class="popup__close" aria-label="Fermer" @click="close">×</button>
      <!-- Rendered only while open: the GIF (2.7 MB) is not downloaded with the page -->
      <img v-if="open" :src="gif" alt="" class="popup__gif" />
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useCornerShortcut } from '@/composables/useCornerShortcut'
import gif from '@/assets/images/easter-egg.gif'

const dialog = useTemplateRef('dialog')
const open = ref(false)

useCornerShortcut(() => {
  if (!dialog.value || dialog.value.open) return
  open.value = true
  dialog.value.showModal()
})

function close() {
  dialog.value?.close()
}

// The content fills the dialog box (no padding on it): a click that lands on the <dialog>
// itself is a click on the backdrop
function onDialogClick(event: MouseEvent) {
  if (event.target === dialog.value) close()
}
</script>

<style scoped lang="scss">
.popup {
  max-width: min(480px, calc(100% - 32px));
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-white);
  box-shadow: 0 8px 24px -4px rgb(17 24 39 / 24%);
  // The UA sets overflow: auto on modal dialogs, which would clip the close button
  overflow: visible;

  &::backdrop {
    background: rgb(17 24 39 / 50%);
  }

  &__content {
    position: relative;
    padding: 12px;
  }

  &__gif {
    display: block;
    max-width: 100%;
    max-height: 70vh;
    border-radius: var(--radius-sm);
  }

  &__close {
    position: absolute;
    top: -12px;
    right: -12px;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--color-gray-200);
    border-radius: 50%;
    background: var(--color-white);
    color: var(--color-gray-900);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      background: var(--color-gray-50);
    }
  }
}
</style>
