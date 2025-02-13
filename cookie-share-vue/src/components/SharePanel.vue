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
          :loading="loading"
          @visible-change="updateDropdownWidth"
          popper-class="cookie-select-dropdown"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
          <el-option
            v-for="cookie in cookieList"
            :key="cookie.id"
            :label="cookie.id"
            :value="cookie.id"
          >
            <div class="cookie-item-content">
              <span class="cookie-id">{{ cookie.id }}</span>
              <span class="cookie-url">{{ cookie.url }}</span>
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

    <div class="update-time" v-if="lastUpdateTime && serverConfig.password">
      最后更新：{{ lastUpdateTime.toLocaleTimeString() }}
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Key, Setting, RefreshRight, Download, Upload, List, Loading } from '@element-plus/icons-vue'
import { useGMValue } from '../composables/useGMValue'
import { useWindowSize } from '@vueuse/core'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'config'): void
}>()

const dialogVisible = ref(true)
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

const loading = ref(false)
const cookieList = ref<Cookie[]>([])
const lastUpdateTime = ref<Date>()

const selectRef = ref<HTMLElement>()

const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)

const updateDropdownWidth = async () => {
  await nextTick()
  if (selectRef.value) {
    const width = selectRef.value.getBoundingClientRect().width
    document.documentElement.style.setProperty('--select-width', `${width}px`)
  }
}

onMounted(() => {
  loadCookieList()
  updateDropdownWidth()
  window.addEventListener('resize', updateDropdownWidth)
})

interface Cookie {
  id: string
  url: string
}

interface CookieListResponse {
  success: boolean
  cookies: Cookie[]
}

const loadCookieList = async () => {
  if (!serverConfig.value?.url) return
  
  loading.value = true
  try {
    const currentHost = window.location.hostname.split('.').slice(-2).join('.')
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    
    if (serverConfig.value.password) {
      headers['X-Admin-Password'] = serverConfig.value.password
    }

    const response = await new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: `${serverConfig.value.url}/admin/list-cookies-by-host/${encodeURIComponent(currentHost)}`,
        headers,
        crossDomain: true,
        anonymous: true,
        credentials: 'omit',
        responseType: 'json',
        timeout: 10000,
        onload: (response) => {
          console.log('收到Cookie列表响应:', {
            status: response.status,
            statusText: response.statusText,
            response: response.response,
            responseText: response.responseText
          })
          resolve(response)
        },
        onerror: (error) => {
          console.error('请求Cookie列表错误:', error)
          reject(new Error('网络请求失败'))
        },
        ontimeout: () => {
          reject(new Error('请求超时'))
        }
      })
    })

    const data = response.response as CookieListResponse
    if (response.status === 200 && data?.success) {
      cookieList.value = data.cookies
      lastUpdateTime.value = new Date()
    } else {
      const errorMsg = data?.message || response.statusText || `HTTP错误 ${response.status}`
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('Cookie列表加载失败详情:', {
      error,
      response: response?.response,
      status: response?.status
    })
    ElMessage.error(`加载失败: ${error.message}`)
    cookieList.value = []
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  cookieId.value = ''
  cookieList.value = []
  lastUpdateTime.value = undefined
  dialogVisible.value = false
  emit('close')
}

const handleConfig = () => {
  emit('config')
}

const handleSend = async () => {
  if (!serverConfig.value) return
  
  sending.value = true
  try {
    const cookies = await new Promise<any[]>((resolve) => {
      GM_cookie.list({}, resolve)
    })

    if (!cookies.length) {
      ElMessage.warning('当前页面没有可分享的Cookie')
      return
    }

    const currentHost = window.location.hostname.split('.').slice(-2).join('.')
    
    const response = await GM_xmlhttpRequest({
      method: 'POST',
      url: `${serverConfig.value.url}/send-cookies`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(serverConfig.value.password ? {
          'X-Admin-Password': serverConfig.value.password
        } : {})
      },
      crossDomain: true,
      anonymous: true,
      credentials: 'omit',
      data: JSON.stringify({
        id: cookieId.value,
        url: `https://${currentHost}`,
        cookies: cookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path || '/',
          secure: cookie.secure,
          sameSite: cookie.sameSite || 'Lax',
          hostOnly: cookie.hostOnly,
          httpOnly: cookie.httpOnly,
          session: cookie.session,
          expirationDate: cookie.expirationDate,
        }))
      }),
      responseType: 'json',
      timeout: 10000
    })

    if (response.status >= 200 && response.status < 300) {
      if (!response.response?.success) {
        throw new Error(response.response?.message || '服务器返回错误')
      }
      ElMessage.success('Cookie分享成功')
    } else {
      throw new Error(response.response?.message || '请求失败')
    }
  } catch (error) {
    ElMessage.error(`分享失败: ${error.message}`)
  } finally {
    sending.value = false
  }
}

const handleReceive = async () => {
  if (!serverConfig.value) return
  
  receiving.value = true
  try {
    console.log('开始获取Cookie...', {
      url: `${serverConfig.value.url}/receive-cookies/${cookieId.value}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(serverConfig.value.password ? {
          'X-Admin-Password': serverConfig.value.password
        } : {})
      }
    })

    const response = await new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: `${serverConfig.value.url}/receive-cookies/${cookieId.value}`,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(serverConfig.value.password ? {
            'X-Admin-Password': serverConfig.value.password
          } : {})
        },
        crossDomain: true,
        anonymous: true,
        credentials: 'omit',
        responseType: 'json',
        timeout: 10000,
        onload: (response) => {
          console.log('收到响应:', {
            status: response.status,
            statusText: response.statusText,
            response: response.response,
            responseText: response.responseText
          })
          resolve(response)
        },
        onerror: (error) => {
          console.error('请求错误:', error)
          reject(new Error('网络请求失败'))
        },
        ontimeout: () => {
          reject(new Error('请求超时'))
        }
      })
    })

    if (response.status >= 200 && response.status < 300) {
      console.log('服务器响应:', response.response)
      
      if (!response.response?.success || !Array.isArray(response.response.cookies)) {
        throw new Error('服务器返回数据格式错误')
      }

      if (!response.response.cookies.length) {
        throw new Error('没有可导入的Cookie')
      }

      console.log('开始清除现有cookies...')
      // 清除现有的 cookies
      await new Promise((resolve) => {
        GM_cookie.list({}, (cookies) => {
          const deletePromises = cookies.map(cookie => 
            new Promise(resolveDelete => {
              GM_cookie.delete({
                name: cookie.name,
                domain: cookie.domain,
                path: cookie.path || '/'
              }, (success) => {
                if (success) {
                  console.log('成功删除cookie:', cookie.name)
                } else {
                  console.error('删除cookie失败:', cookie.name)
                }
                resolveDelete()
              })
            })
          )
          Promise.all(deletePromises).then(resolve)
        })
      })

      console.log('开始设置新cookies...')
      let importedCount = 0
      for (const cookie of response.response.cookies) {
        if (cookie?.name && cookie?.value) {
          try {
            console.log('准备设置cookie:', JSON.stringify(cookie, null, 2))
            await new Promise((resolve, reject) => {
              GM_cookie.set({
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path || '/',
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite || 'Lax',
                expirationDate: cookie.expirationDate
              }, (setCookie, error) => {
                if (error) {
                  console.error('设置cookie失败:', cookie.name, error)
                  reject(error)
                } else {
                  console.log('成功设置cookie:', cookie.name, setCookie)
                  GM_cookie.list({ 
                    domain: cookie.domain,
                    name: cookie.name 
                  }, (currentCookies) => {
                    console.log('验证指定cookie:', {
                      name: cookie.name,
                      domain: cookie.domain,
                      found: currentCookies.length > 0,
                      cookies: currentCookies
                    })
                  })
                  resolve()
                }
              })
            })
            importedCount++
          } catch (error) {
            console.error('设置cookie出错:', cookie.name, error)
          }
        }
      }

      console.log('导入完成，总计:', importedCount)
      if (importedCount === 0) {
        throw new Error('没有可导入的Cookie')
      }

      if (autoRefresh.value) {
        ElMessage.success(`成功导入${importedCount}个Cookie，页面即将刷新`)
        setTimeout(() => window.location.reload(), 1000)
      } else {
        ElMessage.success(`成功导入${importedCount}个Cookie`)
      }

      // 设置后立即验证
      console.log('最终存储的cookies:')
      GM_cookie.list({}, cookies => {
        console.table(cookies.map(c => ({
          name: c.name,
          domain: c.domain,
          path: c.path,
          value: c.value.slice(0, 10) + '...',
          secure: c.secure,
          httpOnly: c.httpOnly
        })))
      })
    } else {
      console.error('HTTP错误:', {
        status: response.status,
        statusText: response.statusText,
        response: response.response,
        responseText: response.responseText
      })
      throw new Error(
        response.response?.message || 
        response.statusText || 
        `HTTP错误 ${response.status}`
      )
    }
  } catch (error) {
    console.error('整体错误:', error, {
      error,
      message: error.message,
      stack: error.stack
    })
    ElMessage.error(`获取失败: ${error.message}`)
  } finally {
    receiving.value = false
  }
}

const handleRefresh = async () => {
  await loadCookieList()
}

watch(serverConfig, (newConfig) => {
  if (newConfig.url) {
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
</style> 
