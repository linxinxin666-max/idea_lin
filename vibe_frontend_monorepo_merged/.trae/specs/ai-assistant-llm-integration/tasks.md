# 剧本AI助手 LLM 对话能力集成 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 定义数据类型和系统提示词
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 定义修改动作的数据类型（ModificationAction）
  - 定义消息类型扩展，添加 'modification' 类型
  - 编写系统提示词，指导 LLM 如何解析用户意图并输出结构化的修改动作
- **Acceptance Criteria Addressed**: [FR-1, FR-3]
- **Test Requirements**:
  - `programmatic` TR-1.1: 类型定义完整且符合 TypeScript 规范
  - `human-judgement` TR-1.2: 系统提示词清晰明确，能够指导 LLM 输出正确格式
- **Notes**: 修改动作应包含：fieldKey（表单字段键）、fieldLabel（字段显示名称）、oldValue（原值）、newValue（新值）、actionType（动作类型：update/add/remove）

## [x] Task 2: 修改 useAIAssistantStore，集成 LLM API
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 从 arkApi.ts 导入 chatCompletionsStream/chatCompletions
  - 修改 sendMessage 函数，调用真实的 LLM API
  - 将当前表单状态作为上下文发送给 LLM
  - 解析 LLM 返回的修改动作
- **Acceptance Criteria Addressed**: [FR-1, FR-2, FR-3]
- **Test Requirements**:
  - `programmatic` TR-2.1: sendMessage 调用真实 LLM API，不使用 mock 数据
  - `programmatic` TR-2.2: 当前表单状态正确地包含在发送给 LLM 的消息中
  - `programmatic` TR-2.3: 能够正确解析 LLM 返回的修改动作
- **Notes**: 使用 useCreateStore.getState().form 获取当前表单状态

## [x] Task 3: 实现确认卡片 UI 组件
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在 AIAssistant.tsx 中实现确认卡片组件
  - 展示修改元素名称、修改前内容、修改后内容
  - 添加「确认」和「取消」按钮
  - 实现确认/取消的回调逻辑
- **Acceptance Criteria Addressed**: [FR-4]
- **Test Requirements**:
  - `human-judgement` TR-3.1: 确认卡片 UI 清晰美观，信息展示完整
  - `human-judgement` TR-3.2: 按钮交互正常，有 hover 效果
  - `programmatic` TR-3.3: 点击确认/取消能正确触发对应回调
- **Notes**: 使用 Semi Design 的 Modal 组件或自定义卡片

## [x] Task 4: 实现确认后的表单修改逻辑
- **Priority**: P0
- **Depends On**: Task 2, Task 3
- **Description**: 
  - 实现确认后的表单修改函数
  - 根据修改动作类型（update/add/remove）调用 useCreateStore 的对应方法
  - 更新 AI 助手消息，显示操作成功提示
  - 实现取消逻辑，显示取消提示
- **Acceptance Criteria Addressed**: [FR-5, AC-4, AC-5]
- **Test Requirements**:
  - `programmatic` TR-4.1: 点击确认后，表单被正确修改
  - `programmatic` TR-4.2: 点击取消后，表单不被修改
  - `human-judgement` TR-4.3: AI 助手显示正确的成功/取消提示
- **Notes**: 对于 coreContents 等数组字段，需要特殊处理

## [x] Task 5: 添加错误处理和加载状态
- **Priority**: P1
- **Depends On**: Task 2
- **Description**: 
  - 添加 LLM API 调用失败时的错误处理
  - 添加 LLM 返回格式错误时的处理
  - 优化加载状态的显示
  - 添加重试机制
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 错误提示友好清晰
  - `programmatic` TR-5.2: 加载状态正确显示
  - `programmatic` TR-5.3: 各种异常情况都有处理
- **Notes**: 使用 Toast 组件显示错误提示

## [x] Task 6: 更新欢迎消息和优化用户体验
- **Priority**: P2
- **Depends On**: Task 1
- **Description**: 
  - 更新欢迎消息，引导用户如何使用对话编辑表单
  - 添加示例提示，告诉用户可以说什么
  - 优化对话流式显示体验
- **Acceptance Criteria Addressed**: [NFR-2]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 欢迎消息清晰友好，有使用指引
  - `human-judgement` TR-6.2: 整体用户体验流畅自然
- **Notes**: 可以给出几个示例，如「把身份改为生活服务运营」、「开场白改成『老板好，我是抖音来客的运营』」
