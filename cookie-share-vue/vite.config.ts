import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monkey, { cdn, util } from 'vite-plugin-monkey'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5174,
    cors: {
      origin: '*',
      methods: 'GET,POST,PUT,DELETE',
      allowedHeaders: 'Content-Type,X-Password'
    },
    proxy: {
      '/api': {
        target: 'http://your-server.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    vue(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    }),
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
          'GM_cookie',
          'GM_xmlhttpRequest',
          'GM_getValue',
          'GM_setValue'
        ],
        connect: ['*']
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr("Vue", "dist/vue.global.prod.js")
              .concat(util.dataUrl(";window.Vue=Vue;")),
          'element-plus': cdn.jsdelivr("ElementPlus", "dist/index.full.min.js"),
          '@element-plus/icons-vue': cdn.jsdelivr("ElementPlusIconsVue", "dist/index.iife.min.js"),
          'vuedraggable': cdn.jsdelivr("vuedraggable", "dist/vuedraggable.umd.js"),
          'sortablejs': cdn.jsdelivr("Sortable", "Sortable.min.js")
        },
        externalResource: {
          'element-plus/dist/index.css': cdn.jsdelivr()
        }
      }
    })
  ]
})
