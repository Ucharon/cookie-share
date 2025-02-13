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
        :disabled="isLocked"
      >
        <template #prefix>
          <el-icon><Connection /></el-icon>
        </template>
        <template v-if="isLocked" #suffix>
          <el-tag type="success" effect="plain">已配置</el-tag>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item label="访问密码" prop="password">
      <el-input
        v-model="form.password"
        type="password"
        show-password
        placeholder="请输入访问密码"
        :disabled="isLocked"
      >
        <template #prefix>
          <el-icon><Lock /></el-icon>
        </template>
      </el-input>
    </el-form-item>

    <el-form-item v-if="!isLocked" label="记住密码" prop="remember">
      <el-switch v-model="form.remember" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, defineExpose } from 'vue'
import { Connection, Lock } from '@element-plus/icons-vue'
import { useGMValue } from '../composables/useGMValue'
import type { FormInstance, FormRules } from 'element-plus'
import CryptoJS from 'crypto-js'

const SECRET_KEY = 'cookie-share-secret-key'

const formRef = ref<FormInstance>()
const isLocked = ref(false)

const { value: storedConfig } = useGMValue('cookie_share_server_config', {
  url: '',
  password: '',
  remember: false
})

const decryptPassword = (ciphertext: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch {
    return ''
  }
}

const form = reactive({
  serverUrl: storedConfig.value.url,
  password: storedConfig.value.password ? decryptPassword(storedConfig.value.password) : '',
  remember: storedConfig.value.remember
})

// 初始化锁定状态
if (storedConfig.value.url) {
  isLocked.value = true
}

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
    { required: true, message: '请输入访问密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
})

// 暴露给父组件的方法
const validate = () => formRef.value?.validate()

const getFormData = () => {
  const encryptedPassword = form.remember 
    ? CryptoJS.AES.encrypt(form.password, SECRET_KEY).toString()
    : ''

  return {
    url: form.serverUrl.replace(/\/$/, ''),
    password: encryptedPassword,
    remember: form.remember
  }
}

const resetForm = () => {
  form.serverUrl = storedConfig.value.url
  form.password = storedConfig.value.password ? decryptPassword(storedConfig.value.password) : ''
  form.remember = storedConfig.value.remember
}

const setLocked = (locked: boolean) => {
  isLocked.value = locked
}

defineExpose({
  validate,
  getFormData,
  resetForm,
  setLocked,
  isLocked
})
</script>

<style scoped>
.server-form {
  margin: 20px 0;
}
</style> 