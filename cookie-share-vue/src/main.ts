import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import './assets/mobile.css'

// 在开发环境中模拟 GM API
if (import.meta.env.DEV) {
  await import('./utils/gm-mock')
}

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)

app.mount(
  (() => {
    const container = document.createElement('div')
    container.id = 'cookie-share-app'
    document.body.appendChild(container)
    return container
  })()
)
