<script setup lang="ts">
import { ref } from 'vue'
import FloatingButton from './components/FloatingButton.vue'
import SharePanel from './components/SharePanel.vue'
import { useGMValue } from './composables/useGMValue'

const showPanel = ref(false)
const { value: autoHideFullscreen } = useGMValue('cookie_share_auto_hide_fullscreen', true)

const showSharePanel = () => {
  showPanel.value = true
}
</script>

<template>
  <FloatingButton
    :auto-hide-fullscreen="autoHideFullscreen"
    @click="showSharePanel"
  />
  <SharePanel
    v-if="showPanel"
    @close="showPanel = false"
  />
</template>
