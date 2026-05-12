# 剧本AI助手 LLM 对话能力集成 - Product Requirement Document

## Overview
- **Summary**: 为剧本AI助手组件引入真实的LLM对话能力，支持用户通过自然语言对话编辑和填充左侧表单。在执行修改前，会先弹出确认卡片让用户审核改动内容，用户确认后才执行真实修改。
- **Purpose**: 提升用户配置剧本的效率，通过自然语言交互降低使用门槛，同时提供确认机制确保用户对每次修改都有完全的控制权。
- **Target Users**: 使用剧本创建/编辑功能的运营人员和产品经理。

## Goals
- 集成现有的 LLM API 服务（arkApi.ts）到剧本AI助手组件
- 实现对话解析当前表单状态并识别用户修改意图
- 实现修改确认卡片 UI，展示修改元素名称和修改后内容
- 实现用户确认后的真实表单修改操作
- 保持良好的用户体验和错误处理

## Non-Goals (Out of Scope)
- 不实现新的 LLM API 接口（复用现有 arkApi.ts）
- 不实现复杂的多步表单联动逻辑
- 不实现批量修改功能（一次只处理一个明确的修改动作）

## Background & Context
- 项目已有完整的 LLM API 封装（arkApi.ts 中的 chatCompletionsStream）
- 表单状态由 useCreateStore 统一管理
- 剧本AI助手组件目前是模拟实现，使用 mock 数据
- 技术栈：React 19 + TypeScript + Zustand + Semi Design

## Functional Requirements
- **FR-1**: LLM 对话集成 - 将真实的 LLM 对话集成到 AI 助手组件
- **FR-2**: 表单状态上下文 - 将当前表单状态发送给 LLM 作为对话上下文
- **FR-3**: 意图识别与动作生成 - LLM 能够识别用户意图并输出结构化的修改动作
- **FR-4**: 确认卡片 UI - 展示修改内容供用户确认
- **FR-5**: 确认后执行修改 - 用户点击确认后执行真实的表单修改

## Non-Functional Requirements
- **NFR-1**: 对话响应时间 < 5秒（包含 LLM 处理时间）
- **NFR-2**: 确认卡片展示清晰，修改内容易于理解
- **NFR-3**: 错误处理友好，有明确的错误提示
- **NFR-4**: 代码符合项目现有规范（AGENTS.md）

## Constraints
- **Technical**: 使用 React 19、TypeScript、Zustand、Semi Design
- **Business**: 复用现有 LLM API（arkApi.ts）
- **Dependencies**: useCreateStore、arkApi.ts

## Assumptions
- LLM API 能够正确解析用户意图并输出结构化数据
- 用户每次对话只要求做一个明确的修改动作
- 表单字段可以通过 fieldKey 唯一标识

## Acceptance Criteria

### AC-1: LLM 对话集成
- **Given**: 用户在剧本AI助手中输入文字消息
- **When**: 点击发送按钮
- **Then**: 调用真实的 LLM API 进行对话，而不是使用 mock 数据
- **Verification**: `programmatic`

### AC-2: 表单状态上下文
- **Given**: 用户在表单页面，表单有当前状态
- **When**: 用户与 AI 助手对话
- **Then**: 当前表单状态被发送给 LLM 作为对话上下文的一部分
- **Verification**: `programmatic`

### AC-3: 修改确认卡片展示
- **Given**: LLM 识别出用户的修改意图并生成了修改动作
- **When**: LLM 返回修改动作后
- **Then**: 显示确认卡片，包含：修改元素名称、修改前内容、修改后内容、确认/取消按钮
- **Verification**: `human-judgment`

### AC-4: 用户确认后执行修改
- **Given**: 用户看到修改确认卡片
- **When**: 用户点击「确认」按钮
- **Then**: 表单被实际修改，AI 助手返回成功提示
- **Verification**: `programmatic`

### AC-5: 用户取消修改
- **Given**: 用户看到修改确认卡片
- **When**: 用户点击「取消」按钮
- **Then**: 表单不被修改，AI 助手返回取消提示
- **Verification**: `programmatic`

### AC-6: 错误处理
- **Given**: LLM API 调用失败或返回格式错误
- **When**: 发生错误时
- **Then**: 显示友好的错误提示，用户可以重试
- **Verification**: `human-judgment`

## Open Questions
- [ ] LLM 返回的修改动作格式需要什么样的规范？
- [ ] 是否需要支持撤销修改？
- [ ] 一次对话可以包含多个修改动作吗？
