# AgentCall 管理 Demo - Product Requirement Document

## Overview
- **Summary**: 一个基于现有 SSO 登录架构的 AgentCall 管理 Demo，包含 AgentCall 列表展示、新建 AgentCall 表单，以及相关配置跳转功能。
- **Purpose**: 快速搭建 AgentCall 管理的基础界面框架，验证 ByteDance SSO 登录与业务页面的集成，为后续功能迭代奠定基础。
- **Target Users**: 内部开发人员和产品经理，用于演示和测试 AgentCall 管理功能。

## Goals
- 接入并验证 ByteDance SSO 登录功能，获取用户信息
- 实现 AgentCall 列表页，展示 AgentCall 信息及操作按钮
- 实现新建 AgentCall 页面，支持基础表单填写
- 使用 mock 数据确保本地开发和测试的独立性

## Non-Goals (Out of Scope)
- 不实现真实的 AgentCall 后端接口
- 不实现 AgentCall 的编辑、删除等功能
- 不实现表单数据的持久化存储
- 不实现复杂的表单验证逻辑

## Background & Context
- 项目采用 React 19 + TypeScript + Vite 技术栈
- 已集成 @arco-design/web-react UI 组件库
- 已有完整的 SSO 登录框架（useSSO hook 和 ProtectedRoute 组件）
- 使用 React Router v6 进行路由管理

## Functional Requirements
- **FR-1**: 用户通过 ByteDance SSO 登录后，系统获取并展示当前登录用户信息
- **FR-2**: 首页展示 AgentCall 列表，包含 AgentCall 名称、描述、创建人字段
- **FR-3**: 列表页右上角提供「新建 AgentCall」按钮，点击跳转到新建页面
- **FR-4**: 每个 AgentCall 项包含 4 个配置跳转按钮（Fornax配置、Agent配置、剧本配置、生产力平台配置）
- **FR-5**: 新建 AgentCall 页面支持填写 AgentCall 名称和描述
- **FR-6**: 所有数据使用 mock 数据，不依赖真实后端接口

## Non-Functional Requirements
- **NFR-1**: 页面加载响应时间 < 2s
- **NFR-2**: 界面风格与现有项目保持一致（使用 Arco Design）
- **NFR-3**: 代码遵循项目现有开发规范（AGENTS.md）

## Constraints
- **Technical**: 使用 React 19、TypeScript、Arco Design、React Router v6
- **Business**: 作为 Demo 项目，开发周期短，功能精简
- **Dependencies**: 依赖现有 useSSO hook 和 ProtectedRoute 组件

## Assumptions
- 现有的 SSO 登录框架能够正常工作
- 用户已通过 SSO 登录后才能访问业务页面
- 4 个配置跳转按钮的链接将在后续提供，当前使用占位链接
- 新建 AgentCall 表单后续会增加更多字段

## Acceptance Criteria

### AC-1: SSO 用户信息展示
- **Given**: 用户已通过 SSO 登录
- **When**: 访问 AgentCall 列表页
- **Then**: 页面展示当前登录用户的姓名、邮箱和头像
- **Verification**: `human-judgment`

### AC-2: AgentCall 列表展示
- **Given**: 用户已登录并访问列表页
- **When**: 页面加载完成
- **Then**: 展示 AgentCall 列表，每个项包含 AgentCall 名称、描述、创建人
- **Verification**: `human-judgment`

### AC-3: 新建 AgentCall 按钮跳转
- **Given**: 用户在 AgentCall 列表页
- **When**: 点击右上角「新建 AgentCall」按钮
- **Then**: 跳转到新建 AgentCall 页面
- **Verification**: `programmatic`

### AC-4: 配置按钮跳转
- **Given**: 用户在 AgentCall 列表页
- **When**: 点击某个 AgentCall 项的配置按钮
- **Then**: 跳转到对应的配置链接
- **Verification**: `programmatic`

### AC-5: 新建 AgentCall 表单
- **Given**: 用户在新建 AgentCall 页面
- **When**: 查看页面内容
- **Then**: 展示 AgentCall 名称和 AgentCall 描述输入框
- **Verification**: `human-judgment`

## Open Questions
- [ ] 4 个配置按钮的具体跳转链接是什么？
- [ ] 新建 AgentCall 表单后续需要补充哪些字段？
- [ ] 是否需要在新建 AgentCall 后跳回列表页？
