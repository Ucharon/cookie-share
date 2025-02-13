import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monkey from 'vite-plugin-monkey'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5174,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Cookie Share',
        namespace: 'https://github.com/xuxihai123/cookie-share',
        version: '1.0.0',
        description: 'Cookie Share - 现代化重构版',
        author: 'xuxihai123',
        match: ['*://*/*'],
        grant: [
          'GM_xmlhttpRequest',
          'GM_cookie',
          'GM_setValue',
          'GM_getValue',
          'GM_deleteValue',
          'GM_listValues',
          'GM_addValueChangeListener',
          'GM_removeValueChangeListener',
          'GM_notification'
        ],
        connect: ['*']
      },
      build: {
        externalGlobals: {
          vue: ['Vue', 'https://unpkg.com/vue@3/dist/vue.global.js'],
          'element-plus': [
            'ElementPlus',
            'https://unpkg.com/element-plus@2.4.4/dist/index.full.js'
          ],
          '@element-plus/icons-vue': [
            'ElementPlusIconsVue',
            'https://unpkg.com/@element-plus/icons-vue@2.3.1/dist/index.iife.min.js'
          ]
        },
        externalResource: {
          'element-plus/dist/index.css': 'https://unpkg.com/element-plus@2.4.4/dist/index.css'
        }
      }
    })
  ]
})
