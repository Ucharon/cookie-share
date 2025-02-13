<template>
  <el-dialog
    v-model="dialogVisible"
    :title="serverConfigRef?.isLocked ? '服务器配置详情' : '服务器配置'"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ServerConfig ref="serverConfigRef" />

    <template #footer>
      <span class="dialog-footer">
        <el-button 
          v-if="serverConfigRef?.isLocked" 
          type="primary" 
          @click="handleEdit"
        >
          修改配置
        </el-button>
        <el-button v-else @click="handleCancel">取消</el-button>
        <el-button 
          v-if="!serverConfigRef?.isLocked" 
          type="primary" 
          @click="handleSave" 
          :loading="saving"
        >
          保存配置
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useGMValue } from '../composables/useGMValue'
import ServerConfig from './ServerConfig.vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'server-saved'): void
}>()

const dialogVisible = ref(true)
const serverConfigRef = ref<InstanceType<typeof ServerConfig>>()
const saving = ref(false)

const { value: storedConfig } = useGMValue('cookie_share_server_config', {
  url: '',
  password: '',
  remember: false
})

const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

const handleEdit = () => {
  serverConfigRef.value?.setLocked(false)
}

const handleCancel = () => {
  if (storedConfig.value.url) {
    serverConfigRef.value?.resetForm()
    serverConfigRef.value?.setLocked(true)
  } else {
    handleClose()
  }
}

const handleSave = async () => {
  if (!serverConfigRef.value) return
  
  const valid = await serverConfigRef.value.validate()
  if (valid) {
    saving.value = true
    try {
      const formData = serverConfigRef.value.getFormData()
      storedConfig.value = formData
      ElMessage.success('服务器配置已保存')
      serverConfigRef.value.setLocked(true)
      emit('server-saved')
    } catch (error) {
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  }
}
</script>

<style scoped>
:deep(.el-dialog__body) {
  padding-top: 10px;
}

.dialog-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style> 