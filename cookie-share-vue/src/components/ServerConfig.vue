<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="100px"
    class="server-form"
  >
    <el-form-item label="服务器地址" prop="serverUrl">
      <el-input
        v-model="form.serverUrl"
        placeholder="https://example.com/your-secret-path"
      >
        <template #prefix>
          <el-icon><Connection /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item label="访问密码" prop="password">
      <el-input
        v-model="form.password"
        type="password"
        show-password
        placeholder="可选，如果你想体验高级的功能请进行填写"
      >
        <template #prefix>
          <el-icon><Lock /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item label="记住密码" prop="remember" v-if="form.password">
      <el-switch v-model="form.remember" />
    </el-form-item>

    <div class="form-actions">
      <el-button type="primary" @click="handleSave" :loading="saving">
        保存配置
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Connection, Lock } from '@element-plus/icons-vue'
import { useGMValue } from '../composables/useGMValue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const emit = defineEmits<{
  (e: 'saved'): void
}>()

const SECRET_KEY = 'cookie-share-secret-key'
const formRef = ref<FormInstance>()
const saving = ref(false)

const { value: storedConfig } = useGMValue('cookie_share_server_config', {
  url: '',
  password: '',
  remember: false
})

const form = reactive({
  serverUrl: storedConfig.value.url,
  password: storedConfig.value.password || '',
  remember: storedConfig.value.remember
})

const rules = reactive<FormRules>({
  serverUrl: [
    { required: true, message: '请输入服务器地址', trigger: 'blur' },
    { 
      pattern: /^https?:\/\/[^/]+\/[^/]+$/,
      message: '请输入有效的服务器地址，格式: https://example.com/your-secret-path',
      trigger: 'blur'
    }
  ],
  password: [
    { min: 6, message: '如果填写密码，长度不能少于6位', trigger: 'blur' }
  ]
})

const handleSave = async () => {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate()
  if (valid) {
    saving.value = true
    try {
      storedConfig.value = {
        url: form.serverUrl.replace(/\/$/, ''),
        password: form.password,
        remember: form.password ? form.remember : false
      }
      
      GM_setValue('cookie_share_server_config', storedConfig.value)
      
      ElMessage.success('配置已保存')
      emit('saved')
    } catch (error) {
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  }
}
</script>

<style scoped>
.server-form {
  margin: 20px 0;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media screen and (max-width: 768px) {
  .server-form {
    margin: 10px 0;
    
    :deep(.el-form-item__label) {
      width: 100% !important;
      text-align: left;
      margin-bottom: 8px;
    }
    
    .el-input {
      font-size: 14px;
    }
    
    .form-actions {
      margin-top: 20px;
      
      .el-button {
        width: 100%;
        padding: 12px;
      }
    }
  }
}
</style> 