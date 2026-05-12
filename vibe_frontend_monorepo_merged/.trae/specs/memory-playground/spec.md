# 记忆可视化 Demo - Product Requirement Document

## Overview
- **Summary**: 创建一个记忆可视化 demo 页面，包含对话能力和短期/长期记忆展示功能。页面路由为 `/self_help/memory_playground`，采用左右布局（左侧70%对话，右侧30%记忆展示）。
- **Purpose**: 提供一个直观的界面来展示对话过程中的记忆系统，包括短期记忆和长期记忆的可视化。
- **Target Users**: 开发团队、产品经理、用户体验设计师，用于演示和测试记忆系统功能。

## Goals
- 创建新的记忆可视化页面，路由为 `/self_help/memory_playground`
- 实现左侧 70% 的对话功能，接入现有 LLM 对话模型（参考 AgentCallChat）
- 实现右侧 30% 的记忆展示区，上下分栏显示短期记忆和长期记忆
- 使用 mock 数据展示记忆的表单式结构
- 遵循项目现有的技术栈和代码规范

## Non-Goals (Out of Scope)
- 不实现真实的记忆接口调用（后续提供）
- 不实现记忆的编辑功能
- 不实现用户认证（使用现有 ProtectedRoute）
- 不进行大规模的架构变更

## Background & Context
- 项目使用 React 19 + TypeScript + Vite 技术栈
- UI 组件库使用 @arco-design/web-react
- 路由管理使用 react-router-dom
- 已有 AgentCallChat 组件可作为对话功能的参考
- 记忆数据采用类似表单的键值对结构，部分值为数组

## Functional Requirements
- **FR-1**: 创建新页面组件 `MemoryPlayground.tsx`
- **FR-2**: 在 App.tsx 中添加路由 `/self_help/memory_playground`
- **FR-3**: 实现左侧 70% 对话区域，支持消息发送和展示
- **FR-4**: 实现右侧 30% 记忆区域，上下分栏布局
- **FR-5**: 实现短期记忆展示组件
- **FR-6**: 实现长期记忆展示组件
- **FR-7**: 创建记忆数据类型定义和 mock 数据

## Non-Functional Requirements
- **NFR-1**: 页面布局响应式，适配不同屏幕尺寸
- **NFR-2**: 对话区域支持 Markdown 渲染（参考 AgentCallChat）
- **NFR-3**: 记忆展示清晰可读，采用卡片式布局
- **NFR-4**: 代码遵循项目现有规范，使用 TypeScript

## Constraints
- **Technical**: React 19, TypeScript, @arco-design/web-react, react-router-dom
- **Business**: 使用现有 ProtectedRoute 保护路由
- **Dependencies**: 依赖现有项目结构和组件库

## Assumptions
- 用户已通过 SSO 登录（使用现有 ProtectedRoute）
- 记忆接口后续提供，当前使用 mock 数据
- 短期记忆和长期记忆的数据结构相同

## Acceptance Criteria

### AC-1: 页面路由可访问
- **Given**: 用户已登录
- **When**: 访问 `/self_help/memory_playground` 路由
- **Then**: 记忆可视化页面正常显示
- **Verification**: `programmatic`

### AC-2: 左侧对话区域布局正确
- **Given**: 页面已加载
- **When**: 查看页面布局
- **Then**: 左侧区域占 70% 宽度，包含对话界面
- **Verification**: `human-judgment`

### AC-3: 右侧记忆区域布局正确
- **Given**: 页面已加载
- **When**: 查看页面布局
- **Then**: 右侧区域占 30% 宽度，上下分栏显示短期记忆和长期记忆
- **Verification**: `human-judgment`

### AC-4: 对话功能可用
- **Given**: 页面已加载
- **When**: 用户在输入框输入消息并发送
- **Then**: 消息显示在对话区域，模拟回复也正常显示
- **Verification**: `human-judgment`

### AC-5: 短期记忆展示正确
- **Given**: 页面已加载
- **When**: 查看右侧上方区域
- **Then**: 短期记忆以表单式结构展示，数据清晰可读
- **Verification**: `human-judgment`

### AC-6: 长期记忆展示正确
- **Given**: 页面已加载
- **When**: 查看右侧下方区域
- **Then**: 长期记忆以表单式结构展示，数据清晰可读
- **Verification**: `human-judgment`

## Open Questions
- 无
