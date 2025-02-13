import { createApp } from 'vue'
import App from './App.vue'

// 在开发环境中模拟 GM API
if (import.meta.env.DEV) {
  await import('./utils/gm-mock')
}

const app = createApp(App)

app.mount(
  (() => {
    const container = document.createElement('div')
    container.id = 'cookie-share-app'
    document.body.appendChild(container)
    return container
  })()
)
