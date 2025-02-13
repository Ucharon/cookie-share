# Cookie Share - 现代化重构版

[![Vue3](https://img.shields.io/badge/Vue-3.4-42b883)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org/)

*注：本重构版使用现代前端技术栈，保持原有功能的同时提升开发体验和可维护性*

## 🚀 技术栈

- **核心框架**: Vue 3.4 + Composition API
- **构建工具**: Vite 5.x
- **油猴适配**: `vite-plugin-monkey`
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **UI 组件**: Vuetify 3.x / Element Plus（可选）
- **代码规范**: ESLint + Prettier
- **测试框架**: Vitest + Playwright

## 📂 项目结构

```text
cookie-share/
├── src/
│   ├── core/            # 核心逻辑
│   │   ├── cookie.ts    # Cookie 操作封装
│   │   └── gm-api.ts    # GM API 适配层
│   ├── api/             # 接口模块
│   ├── components/      # Vue 组件
│   │   ├── SendPanel.vue
│   │   ├── ReceivePanel.vue
│   │   └── AdminPanel.vue
│   ├── stores/          # Pinia 状态管理
│   ├── assets/          # 静态资源
│   └── main.ts          # 入口文件
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── package.json
```

## 🔧 重构步骤

### 1. 项目初始化
```bash
npm create vite@latest cookie-share -- --template vue-ts
cd cookie-share
npm i -D vite-plugin-monkey @types/tampermonkey
```

### 2. 配置 Vite (vite.config.ts)
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monkey from 'vite-plugin-monkey'

export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Cookie Share',
        namespace: 'https://github.com/yourname/cookie-share',
        match: ['*://*/*'],
        grant: ['GM_xmlhttpRequest', 'GM_cookie', 'GM_setValue', 'GM_getValue'],
        connect: '*'
      },
      build: {
        externalGlobals: {
          vue: ['https://unpkg.com/vue@3/dist/vue.global.js', 'Vue']
        }
      }
    })
  ]
})
```

### 3. 核心功能迁移策略

| 原功能模块       | 重构方案                          |
|------------------|----------------------------------|
| UI Components    | 拆分为 Vue SFC 组件 + Composition API |
| Cookie 操作      | 封装为 TypeScript 类 + Pinia Store   |
| GM API 调用      | 适配层 + 响应式集成                |
| 状态管理         | Pinia 集中管理 + 持久化            |
| 网络请求         | Axios 封装 + 拦截器                |

### 4. 开发优势
- **热重载支持**: 实时预览脚本修改
- **类型安全**: TypeScript 全面支持
- **模块化开发**: 功能组件解耦
- **现代 UI**: 组件库集成 + CSS 变量
- **自动化构建**: 一键生成.user.js

### 5. 测试策略
```text
- 单元测试: Vitest + Testing Library
- E2E 测试: Playwright
- GM API Mock: 自定义模拟层
```

## 🌟 新特性计划
1. 可视化 Cookie 管理界面
2. 多设备同步历史记录
3. 自动 Cookie 过期检测
4. 增强型权限控制
5. 主题系统（深色/浅色模式）

## 🎨 UI/UX 改进

### 1. 悬浮按钮优化
- **交互优化**
  - 实现垂直方向拖拽和边缘吸附
  - 优化点击判定逻辑
  - 添加位置记忆功能
  - 改进拖拽体验

- **移动端适配**
  - 添加触摸事件支持
  - 优化移动端尺寸
  - 改进触摸反馈效果
  - 禁用不必要的悬停效果

- **视觉效果**
  - 增加渐变背景和边框
  - 优化阴影效果
  - 提高整体对比度
  - 适配暗色模式

- **动画效果**
  - 添加入场动画
  - 优化过渡效果
  - 改进拖拽时的视觉反馈
  - 增加图标动效

- **性能优化**
  - 添加 GPU 加速
  - 优化事件监听
  - 改进状态管理
  - 提升动画性能

## 🛠️ 开发命令
```bash
# 开发模式（带热更新）
npm run dev

# 生产构建
npm run build

# 测试
npm run test
```

## 🔒 安全增强
- 加密 Cookie 存储（AES-256）
- 请求签名验证
- 敏感操作二次确认
- 操作日志审计
```

---

## 重构关键点说明

1. **架构升级**：
- 使用 Vue3 Composition API 实现逻辑复用
- 将原有命令式代码转换为声明式组件
- 实现响应式状态管理

2. **GM API 适配**：
```typescript
// 示例：封装 GM_xmlhttpRequest
export const gmRequest = (config: RequestConfig) => {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      ...config,
      onload: (res) => resolve(res),
      onerror: (err) => reject(err)
    })
  })
}
```

3. **渐进式迁移策略**：
- Phase 1：基础架构搭建
- Phase 2：核心功能迁移
- Phase 3：UI 现代化改造
- Phase 4：测试覆盖
- Phase 5：文档更新

4. **构建优化**：
- 自动生成 meta 头
- 代码分割优化
- 依赖外部化
- 生成 sourcemap
