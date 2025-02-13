<template>
  <el-dialog
    v-model="dialogVisible"
    title="Cookie 分享"
    :width="isMobile ? '90%' : '500px'"
    :close-on-click-modal="true"
    :show-close="true"
    :close-on-press-escape="true"
    @close="handleClose"
    class="mobile-optimized-dialog"
  >
    <div class="panel-header">
      <div class="server-info">
        <el-tag size="small" type="info" class="server-tag">当前服务器</el-tag>
        <span class="server-url">{{ serverUrl }}</span>
      </div>
      <div class="header-actions" v-if="serverConfig.password">
        <el-button 
          type="default"
          size="small"
          @click="handleRefresh"
          :loading="loading"
          class="refresh-btn"
        >
          <el-icon><RefreshRight /></el-icon>
          {{ loading ? '加载中' : '刷新' }}
        </el-button>
        <el-button 
          type="primary" 
          link 
          class="config-btn"
          @click="handleConfig"
        >
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
      <div class="header-actions" v-else>
        <el-button 
          type="primary" 
          link 
          class="config-btn"
          @click="handleConfig"
        >
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <el-divider>Cookie 操作</el-divider>
    
    <div class="cookie-operations">
      <!-- 有密码时显示下拉框，无密码时显示普通输入框 -->
      <template v-if="serverConfig.password">
        <el-select
          ref="selectRef"
          v-model="cookieId"
          filterable
          allow-create
          default-first-option
          placeholder="输入Cookie ID"
          class="cookie-input"
          :loading="cookieLoading"
          @visible-change="updateDropdownWidth"
          popper-class="cookie-select-dropdown"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
          <el-option
            v-for="cookie in sortedCookies"
            :key="cookie.id"
            :label="cookie.id"
            :value="cookie.id"
            :class="{ 'imported-cookie': isImported(cookie.id) }"
          >
            <div class="cookie-item-content">
              <span class="cookie-id">{{ cookie.id }}</span>
              <span class="cookie-url">{{ cookie.url }}</span>
              <div class="cookie-status">
                <el-icon v-if="isImported(cookie.id)" class="imported-icon">
                  <CircleCheck />
                </el-icon>
                <span v-else class="unimported-text">未导入</span>
                <span v-if="getLastUsed(cookie.id)" class="last-used">
                  {{ formatTime(getLastUsed(cookie.id)) }}
                </span>
              </div>
              <el-button
                type="primary"
                link
                size="small"
                @click.stop="toggleQuickSave(cookie)"
              >
                <el-icon>
                  <StarFilled v-if="isImported(cookie.id)" class="star-filled" />
                  <Star v-else class="star-outline" />
                </el-icon>
              </el-button>
            </div>
          </el-option>
        </el-select>
      </template>
      <template v-else>
        <el-input
          v-model="cookieId"
          placeholder="输入Cookie ID"
          class="cookie-input"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
      </template>
      
      <div class="operation-settings">
        <el-checkbox 
          v-model="autoRefresh" 
          class="refresh-option"
          size="small"
        >
          导入后自动刷新
        </el-checkbox>
      </div>
      
      <div class="operation-buttons">
        <el-button 
          type="primary" 
          :disabled="!isOperational"
          @click="handleReceive"
          :loading="receiving"
        >
          <el-icon><Download /></el-icon>
          获取Cookie
        </el-button>
        <el-button 
          type="success" 
          :disabled="!isOperational || !serverConfig.password"
          @click="handleSend"
          :loading="sending"
          v-if="serverConfig.password"
        >
          <el-icon><Upload /></el-icon>
          分享Cookie
        </el-button>
      </div>
    </div>

    <div class="update-time" v-if="cookieLastUpdateTime && serverConfig.password">
      最后更新：{{ cookieLastUpdateTime.toLocaleTimeString() }}
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Setting, RefreshRight, Download, Upload, List, Loading, StarFilled, CircleCheck, Star } from '@element-plus/icons-vue'
import { useGMValue } from '../composables/useGMValue'
import { useWindowSize } from '@vueuse/core'
import { debounce } from 'lodash-es'
import { useCookieOperations } from '../composables/useCookieOperations'
import { useLocalCookies } from '../composables/useLocalCookies'
import type { Cookie, CookieListResponse, GMXMLHttpRequestResponse } from '../types/cookie'

const props = defineProps<{
  visible: boolean
}>()

const dialogVisible = ref(props.visible)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'config'): void
  (e: 'update:visible', value: boolean): void
  (e: 'quick-list-update'): void
}>()

const cookieId = ref('')
const sending = ref(false)
const receiving = ref(false)
const autoRefresh = ref(true)

const { value: serverConfig } = useGMValue('cookie_share_server_config', {
  url: '',
  password: '',
  remember: false
})

const serverUrl = computed(() => {
  const url = new URL(serverConfig.value.url)
  return `${url.protocol}//${url.hostname}`
})

const isOperational = computed(() => {
  return cookieId.value.trim().length > 0
})

const selectRef = ref<HTMLElement>()

const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)

const updateDropdownWidth = debounce(async () => {
  await nextTick()
  if (selectRef.value) {
    const width = selectRef.value.getBoundingClientRect().width
    document.documentElement.style.setProperty('--select-width', `${width}px`)
  }
}, 100)

const {
  loading: cookieLoading,
  receiving: cookieReceiving,
  cookieList: availableCookies,
  lastUpdateTime: cookieLastUpdateTime,
  loadCookieList,
  receiveCookie
} = useCookieOperations()

const { addCookie, updateLastUsed, savedCookies, removeCookie } = useLocalCookies()

const isImported = (cookieId: string) => {
  return savedCookies.value.some(c => c.id === cookieId)
}

const getLastUsed = (cookieId: string) => {
  const cookie = savedCookies.value.find(c => c.id === cookieId)
  return cookie?.lastUsed
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const sortedCookies = computed(() => {
  return [...availableCookies.value].sort((a, b) => {
    const aImported = isImported(a.id)
    const bImported = isImported(b.id)
    
    if (aImported && !bImported) return -1
    if (!aImported && bImported) return 1
    
    if (aImported && bImported) {
      const aTime = getLastUsed(a.id) || 0
      const bTime = getLastUsed(b.id) || 0
      return bTime - aTime
    }
    
    return 0
  })
})

onMounted(() => {
  loadCookieList()
  updateDropdownWidth()
  window.addEventListener('resize', updateDropdownWidth)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDropdownWidth)
})

const handleClose = () => {
  cookieId.value = ''
  availableCookies.value = []
  cookieLastUpdateTime.value = undefined
  cookieLoading.value = false
  emit('update:visible', false)
}

const handleConfig = () => {
  emit('config')
}

const handleSend = async () => {
  if (!serverConfig.value) return
  
  sending.value = true
  try {
    const cookies = await new Promise<any[]>((resolve) => {
      (window as any).GM_cookie.list({}, resolve)
    })

    if (!cookies.length) {
      ElMessage.warning('当前页面没有可分享的Cookie')
      return
    }

    const currentHost = window.location.hostname.split('.').slice(-2).join('.')
    const baseDomain = `.${currentHost}`

    const requestData = {
      id: cookieId.value,
      url: `https://${currentHost}`,
      cookies: cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: baseDomain,
        path: cookie.path || '/',
        secure: cookie.secure,
        sameSite: 'Lax',
        hostOnly: false,
        httpOnly: cookie.httpOnly,
        session: cookie.session,
        expirationDate: cookie.expirationDate,
      }))
    }

    const response = await new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "POST",
        url: `${serverConfig.value.url}/send-cookies`,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(serverConfig.value.password ? {
            "X-Admin-Password": serverConfig.value.password
          } : {})
        },
        data: JSON.stringify(requestData),
        onload: resolve,
        onerror: reject,
        ontimeout: () => reject(new Error('请求超时'))
      })
    }) as any

    console.log('响应状态:', response.status)
    console.log('响应内容:', response.responseText)

    if (response.status >= 200 && response.status < 300) {
      const data = JSON.parse(response.responseText)
      if (data?.success) {
        ElMessage.success(data.message || 'Cookie分享成功')
        if (autoRefresh.value) {
          await loadCookieList()
        }
      } else {
        throw new Error(data?.message || '服务器返回错误')
      }
    } else {
      const errorData = response.responseText ? JSON.parse(response.responseText) : {}
      throw new Error(errorData?.message || `HTTP错误 ${response.status}`)
    }
  } catch (error: unknown) {
    console.error('分享失败完整错误:', error)
    ElMessage.error(`分享失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    sending.value = false
  }
}

const handleReceive = async () => {
  const success = await receiveCookie(cookieId.value)
  if (success && autoRefresh.value) {
    const { updateLastUsed } = useLocalCookies()
    updateLastUsed(cookieId.value)
    setTimeout(() => window.location.reload(), 1000)
  }
}

const handleRefresh = async () => {
  await loadCookieList()
}

const toggleQuickSave = (cookie: Cookie) => {
  if (isImported(cookie.id)) {
    removeCookie(cookie.id)
    ElMessage.success('已从快捷导入移除')
  } else {
    addCookie(cookie)
    ElMessage.success('已添加到快捷导入')
  }
  emit('quick-list-update')
}

watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  if (newVal) {
    loadCookieList()
  }
})

watch(serverConfig, (newConfig) => {
  if (newConfig.url && newConfig.url !== serverConfig.value.url) {
    loadCookieList()
  }
}, { deep: true, immediate: true })
</script>

<style scoped>
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.server-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.server-tag {
  flex-shrink: 0;
}

.server-url {
  color: var(--el-text-color-regular);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-btn {
  padding: 8px;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.config-btn:hover {
  transform: rotate(45deg);
}

.cookie-operations {
  padding: 20px 10px;
}

.cookie-input {
  width: 100%;
}

.cookie-input :deep(.el-input__wrapper) {
  padding: 0 12px;
  background-color: var(--el-fill-color-blank);
}

.cookie-input :deep(.el-input__prefix) {
  margin-right: 8px;
}

.cookie-input :deep(.el-input__suffix) {
  margin-left: 8px;
}

.cookie-input :deep(.el-button) {
  padding: 0;
  border: none;
  height: 28px;
  width: 28px;
}

.cookie-input :deep(.el-select__tags) {
  margin-left: 30px;
}

.operation-settings {
  margin: 12px 0 -4px;
  display: flex;
  justify-content: flex-end;
}

.refresh-option {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.refresh-option :deep(.el-checkbox__label) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.refresh-option :deep(.el-icon) {
  font-size: 14px;
}

.operation-buttons {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.operation-buttons .el-button {
  min-width: 120px;
  width: 120px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 15px;
}

:deep(.el-dialog__body) {
  padding-top: 20px;
}

:deep(.el-divider__text) {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

/* 添加一些动画效果 */
.el-button {
  transition: all 0.3s ease;
}

.el-button:not(:disabled):hover {
  transform: translateY(-2px);
}

.el-button:not(:disabled):active {
  transform: translateY(0);
}

.cookie-list {
  max-height: 300px;
  overflow-y: auto;
}

.cookie-list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: var(--el-text-color-secondary);
}

.cookie-list-items {
  padding: 4px 0;
}

.cookie-list-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.cookie-item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.cookie-id {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.cookie-url {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cookie-list-item:hover {
  background-color: var(--el-fill-color-light);
}

.cookie-list-item:last-child {
  border-bottom: none;
}

.cookie-list-empty {
  padding: 12px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

:global(.cookie-select-dropdown) {
  width: var(--select-width) !important;
  margin: 0 !important;
  transform-origin: center top !important;
}

:global(.cookie-select-dropdown .el-select-dropdown__wrap) {
  max-height: 300px;
}

:global(.cookie-select-dropdown .el-select-dropdown__item) {
  padding: 8px 12px;
}

:global(.cookie-select-dropdown .el-select-dropdown__list) {
  padding: 4px 0;
}

/* 添加下拉框定位修复 */
:global(.el-popper.cookie-select-dropdown) {
  position: fixed !important;
}

:global(.el-select-dropdown.cookie-select-dropdown[data-popper-placement^='top']) {
  margin-bottom: 12px !important;
}

:global(.el-select-dropdown.cookie-select-dropdown[data-popper-placement^='bottom']) {
  margin-top: 12px !important;
}

/* 移动端优化 */
@media screen and (max-width: 768px) {
  .panel-header {
    flex-direction: row !important;
    gap: 8px;
  }
  
  .header-actions {
    flex-shrink: 0;
  }
  
  .server-url {
    max-width: 50vw;
  }

  .operation-buttons {
    flex-direction: column;
  }

  .operation-buttons .el-button {
    width: 100%;
    min-width: auto;
    padding: 12px;
  }

  .cookie-input :deep(.el-input__inner) {
    font-size: 14px;
    padding: 0 8px;
  }
}

:global(.mobile-optimized-dialog) {
  .el-dialog {
    border-radius: 8px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    
    &__body {
      overflow-y: auto;
      padding: 15px;
    }
  }
}

.update-time {
  margin-top: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  transform: translateY(-1px);
}

.cookie-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.imported-icon {
  color: var(--el-color-success);
  font-size: 14px;
}

.unimported-text {
  color: var(--el-text-color-secondary);
}

.last-used {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

:deep(.imported-cookie) {
  background-color: var(--el-color-success-light-9);
  
  &:hover {
    background-color: var(--el-color-success-light-8);
  }
  
  .cookie-id {
    color: var(--el-color-success);
  }
}

.star-filled {
  color: var(--el-color-warning);
}

.star-outline {
  color: var(--el-text-color-secondary);
  transition: all 0.3s ease;
}

.star-outline:hover {
  color: var(--el-color-primary);
  transform: scale(1.2);
}
</style> 
