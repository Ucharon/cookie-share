<template>
  <div class="cookie-share-overlay" @click="handleOverlayClick">
    <div class="cookie-share-modal">
      <div class="cookie-share-container">
        <button class="close-btn" @click="$emit('close')">×</button>
        <div class="title-container">
          <h1>Cookie Share</h1>
          <a href="https://github.com/fangyuan99/cookie-share" target="_blank" class="github-link">
            <img src="https://fastly.jsdelivr.net/gh/clash-verge-rev/clash-verge-rev.github.io@main/docs/assets/icons/github.svg" alt="GitHub">
          </a>
        </div>

        <div class="id-input-container">
          <select v-model="selectedId" class="cookie-id-select">
            <option value="">选择 Cookie ID</option>
            <option v-for="id in cookieIds" :key="id" :value="id">{{ id }}</option>
          </select>
          <input
            v-model="cookieId"
            type="text"
            class="cookie-id-input"
            placeholder="或输入 Cookie ID"
          >
          <button class="generate-btn" @click="generateId">生成 ID</button>
        </div>

        <input
          v-model="serverUrl"
          type="text"
          class="server-url-input"
          placeholder="服务器地址 (例如: https://example.com)"
        >

        <div class="action-buttons">
          <button class="action-btn send-btn" @click="handleSend">发送 Cookie</button>
          <button class="action-btn receive-btn" @click="handleReceive">接收 Cookie</button>
        </div>

        <button class="clear-btn" @click="handleClear">清除当前页面所有 Cookie</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGMValue } from '../composables/useGMValue'
import { useNotification } from '../composables/useNotification'
import { useConfirm } from '../composables/useConfirm'
import { useCookieManager } from '../composables/useCookieManager'
import { useApi } from '../composables/useApi'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const notification = useNotification()
const confirm = useConfirm()
const cookieManager = useCookieManager()
const api = useApi()

const cookieId = ref('')
const selectedId = ref('')
const cookieIds = ref<string[]>([])
const { value: serverUrl } = useGMValue('cookie_share_custom_url', '')

// 监听 selectedId 变化，自动填充 cookieId
watch(selectedId, (newId) => {
  if (newId) {
    cookieId.value = newId
  }
})

const generateId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  cookieId.value = Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  selectedId.value = ''
}

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('close')
  }
}

const handleSend = async () => {
  try {
    if (!cookieId.value) {
      notification.error('请输入或选择 Cookie ID')
      return
    }

    if (!serverUrl.value) {
      notification.error('请输入服务器地址')
      return
    }

    const result = await api.sendCookies(cookieId.value, serverUrl.value)
    notification.success(result.message || '发送成功')
  } catch (error) {
    notification.error(`发送失败: ${(error as Error).message}`)
  }
}

const handleReceive = async () => {
  try {
    if (!cookieId.value) {
      notification.error('请输入或选择 Cookie ID')
      return
    }

    if (!serverUrl.value) {
      notification.error('请输入服务器地址')
      return
    }

    const result = await api.receiveCookies(cookieId.value, serverUrl.value)
    notification.success(result.message || '接收成功')
  } catch (error) {
    notification.error(`接收失败: ${(error as Error).message}`)
  }
}

const handleClear = async () => {
  if (await confirm.delete('确定要清除当前页面的所有 Cookie 吗？')) {
    await cookieManager.clearAll()
    notification.success('Cookie 已清除，页面即将刷新')
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }
}

onMounted(async () => {
  // 如果有服务器地址和管理员密码，加载 Cookie ID 列表
  const adminPassword = GM_getValue('cookie_share_admin_password', '')
  if (serverUrl.value && adminPassword) {
    try {
      const currentHost = window.location.hostname.split('.').slice(-2).join('.')
      const response = await api.listCookies(currentHost, adminPassword)
      if (response.success && Array.isArray(response.cookies)) {
        cookieIds.value = response.cookies.map((cookie: { id: string }) => cookie.id)
      }
    } catch (error) {
      console.error('Failed to load cookie IDs:', error)
    }
  }
})
</script>

<style scoped>
.cookie-share-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.4) !important;
  z-index: 2147483646 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.cookie-share-modal {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15) !important;
  width: min(800px, 90vw) !important;
  max-height: 90vh !important;
  overflow: hidden !important;
  position: relative !important;
  z-index: 2147483647 !important;
  padding: 24px !important;
}

.cookie-share-container {
  font-family: -apple-system, system-ui, sans-serif !important;
  padding: 32px !important;
}

.close-btn {
  position: absolute !important;
  right: 16px !important;
  top: 16px !important;
  width: 32px !important;
  height: 32px !important;
  background: none !important;
  border: none !important;
  font-size: 24px !important;
  color: #666 !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
}

.title-container {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  margin-bottom: 20px !important;
}

.title-container h1 {
  margin: 0 !important;
  font-size: 32px !important;
  font-weight: 600 !important;
  color: #333 !important;
}

.github-link {
  position: absolute !important;
  right: 0 !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.github-link img {
  width: 20px !important;
  height: 20px !important;
  opacity: 0.7 !important;
  transition: all 0.3s ease !important;
}

.github-link:hover img {
  opacity: 1 !important;
}

.id-input-container {
  display: flex !important;
  padding: 0 0 16px 0 !important;
  gap: 16px !important;
  align-items: center !important;
}

.cookie-id-select,
.cookie-id-input,
.server-url-input {
  height: 48px !important;
  padding: 0 16px !important;
  border: 1px solid #ddd !important;
  border-radius: 8px !important;
  font-size: 16px !important;
}

.cookie-id-select {
  width: 180px !important;
  flex-shrink: 0 !important;
  background: white !important;
}

.cookie-id-input {
  flex-grow: 1 !important;
}

.server-url-input {
  width: 100% !important;
  margin-bottom: 16px !important;
}

.generate-btn {
  width: 120px !important;
  height: 48px !important;
  flex-shrink: 0 !important;
  background: #f3f3f3 !important;
  color: #333 !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  cursor: pointer !important;
}

.action-buttons {
  display: flex !important;
  gap: 16px !important;
  margin-bottom: 16px !important;
}

.action-btn {
  flex: 1 !important;
  height: 48px !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  background: #91B3A7 !important;
  color: white !important;
  transition: all 0.3s ease !important;
}

.action-btn:hover {
  background: #7A9B8F !important;
  transform: translateY(-1px) !important;
}

.clear-btn {
  width: 100% !important;
  height: 48px !important;
  border: none !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  background: #FF6B6B !important;
  color: white !important;
  transition: all 0.3s ease !important;
}

.clear-btn:hover {
  background: #FF5252 !important;
  transform: translateY(-1px) !important;
}

@media screen and (max-width: 480px) {
  .cookie-share-container {
    padding: 20px !important;
  }

  .action-buttons {
    flex-direction: column !important;
  }

  .id-input-container {
    flex-direction: column !important;
  }

  .cookie-id-select,
  .cookie-id-input,
  .generate-btn {
    width: 100% !important;
  }
}
</style> 