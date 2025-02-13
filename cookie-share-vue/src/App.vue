<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import FloatingButton from './components/FloatingButton.vue'
import SharePanel from './components/SharePanel.vue'
import ServerConfig from './components/ServerConfig.vue'
import { useGMValue } from './composables/useGMValue'
import { useWindowSize } from '@vueuse/core'

const showPanel = ref(false)
const showConfig = ref(false)
const { value: autoHideFullscreen } = useGMValue('cookie_share_auto_hide_fullscreen', true)
const { value: serverConfig } = useGMValue('cookie_share_server_config', {
  url: '',
  password: '',
  remember: false
})

const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)

// 检查是否已配置服务器
const checkServerConfig = () => {
  if (!serverConfig.value.url) {
    showConfig.value = true
  } else {
    showPanel.value = true
  }
}

const handleConfigSaved = () => {
  showConfig.value = false
  showPanel.value = true
}

const handlePanelClose = () => {
  showPanel.value = false
}

const handleConfigClose = () => {
  // 如果未配置服务器，不允许关闭配置窗口
  if (serverConfig.value.url) {
    showConfig.value = false
  }
}
</script>

<template>
  <FloatingButton
    :auto-hide-fullscreen="autoHideFullscreen"
    @click="checkServerConfig"
  />
  
  <!-- 服务器配置对话框 -->
  <el-dialog
    v-model="showConfig"
    title="服务器配置"
    :width="isMobile ? '90%' : '500px'"
    :close-on-click-modal="!!serverConfig.url"
    :show-close="!!serverConfig.url"
    :close-on-press-escape="!!serverConfig.url"
    @close="handleConfigClose"
    class="mobile-optimized-dialog"
  >
    <ServerConfig @saved="handleConfigSaved" />
  </el-dialog>

  <!-- Cookie操作面板 -->
  <SharePanel
    v-if="showPanel"
    @close="handlePanelClose"
    @config="showConfig = true"
  />
</template>

<style>
.el-dialog {
  border-radius: 8px;
  overflow: hidden;
}
</style>
