<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import FloatingButton from './components/FloatingButton.vue'
import SharePanel from './components/SharePanel.vue'
import ServerConfig from './components/ServerConfig.vue'
import { useGMValue } from './composables/useGMValue'
import { useWindowSize } from '@vueuse/core'
import type { ServerConfig as ServerConfigType } from './types/cookie'

const showPanel = ref(false)
const showConfig = ref(false)
const { value: autoHideFullscreen } = useGMValue('cookie_share_auto_hide_fullscreen', true)
const { value: serverConfig } = useGMValue<ServerConfigType>('cookie_share_server_config', {
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
  // 无论是否配置都允许关闭
  showConfig.value = false
}

const handleQuickListUpdate = () => {
  // 通知 FloatingButton 组件更新列表
  if (floatingButtonRef.value) {
    floatingButtonRef.value.loadCookieList()
  }
}

const handleOpenMainPanel = () => {
  checkServerConfig()
}
</script>

<template>
  <FloatingButton
    :auto-hide-fullscreen="autoHideFullscreen"
    @click="checkServerConfig"
    @open-main-panel="handleOpenMainPanel"
  />
  
  <!-- 服务器配置对话框 -->
  <el-dialog
    v-model="showConfig"
    title="服务器配置"
    :width="isMobile ? '90%' : '500px'"
    :close-on-click-modal="true"
    :show-close="true"
    :close-on-press-escape="true"
    @close="handleConfigClose"
    class="mobile-optimized-dialog"
    destroy-on-close
  >
    <ServerConfig @saved="handleConfigSaved" />
  </el-dialog>

  <!-- Cookie操作面板 -->
  <SharePanel
    v-model:visible="showPanel"
    @config="showConfig = true"
    @quick-list-update="handleQuickListUpdate"
  />
</template>

<style>
.el-dialog {
  border-radius: 8px;
  overflow: hidden;
}
</style>
