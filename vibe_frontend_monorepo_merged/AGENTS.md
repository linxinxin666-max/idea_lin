# 开发范式与规范 (Development Guidelines)

本文档旨在统一 `vibe_frontend_monorepo` 项目的开发规范、技术栈选型及协作流程，确保代码质量与可维护性。

## 1. 核心技术栈 (Core Stack)

所有子项目（Packages/Apps）必须遵循以下核心依赖版本：

- **React**: `^19.0.0`
  - 强制使用 React 19 的新特性（如 Actions, useOptimistic 等）处理状态与交互。
  - 废弃过时的模式（如 `forwardRef`，直接在 props 中使用 `ref`）。
- **ReactDOM**: `^19.0.0`
- **TypeScript**: `^5.0.0` (推荐最新稳定版)
- **Node.js**: `16.15.0`

## 2. 包管理与 Monorepo (Package Management)

- **包管理器**: 统一使用 **npm**。
- **Monorepo 工具**: 推荐使用 **Turborepo** 进行构建加速与任务编排。
- **Workspace**: 使用 npm workspace 管理内部依赖。

## 3. 代码风格与规范 (Code Style)

### 3.1 Linter & Formatter
- **ESLint**: 用于代码质量检查。
- **Prettier**: 用于代码格式化。
- **规范**:
  - 必须配置 Git Hook (使用 `husky` + `lint-staged`)，在提交前自动执行 lint 和 format。
  - 禁止提交带有 ESLint 错误的代码。

### 3.2 命名规范
- **组件文件**: PascalCase (e.g., `Button.tsx`)
- **普通文件**: camelCase 或 kebab-case (e.g., `utils.ts`, `user-api.ts`)
- **组件命名**: PascalCase (e.g., `function UserProfile() {}`)
- **Hooks**: 以 `use` 开头 (e.g., `useTheme`)

## 4. 提交规范 (Git Commit Convention)

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档变更
- `style`: 代码格式调整（不影响逻辑）
- `refactor`: 代码重构（无新功能或 Bug 修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

**示例**: `feat(auth): add login form validation`

## 5. React 19 特性适配指南

鉴于强制使用 React 19，开发中请注意：

- **Server Components**: 默认优先考虑 Server Components (RSC)，仅在需要交互时使用 `'use client'`。
- **Data Fetching**: 利用 React 19 的 Suspense 机制和 `use` API 进行数据获取。
- **Forms**: 使用 React 19 的 Actions (`<form action={action} />`) 处理表单提交，减少手动 `onSubmit` 处理。
- **Refs**: 在函数组件中直接通过 props 接收 `ref`，不再使用 `forwardRef`。
- **Context**: 直接使用 `<Context>` 作为 provider，不再需要 `<Context.Provider>`。

## 6. 目录结构建议 (Directory Structure)

```
apps/
  web/          # 主应用
  docs/         # 文档站点
packages/
  ui/           # 共享 UI 组件库
  config/       # 共享配置 (ESLint, TSConfig)
  utils/        # 共享工具函数
```

---

> 本文档由团队维护，如有变更需求，请发起 Pull Request 讨论。
