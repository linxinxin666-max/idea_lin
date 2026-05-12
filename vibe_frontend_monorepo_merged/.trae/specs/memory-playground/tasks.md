# 记忆可视化 Demo - The Implementation Plan (Decomposed and Prioritized Task List)

## [ ] Task 1: 创建记忆数据类型定义和 mock 数据
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建记忆数据的 TypeScript 类型定义
  - 创建短期记忆和长期记忆的 mock 数据
  - 数据结构采用键值对形式，部分值为数组
- **Acceptance Criteria Addressed**: [AC-5, AC-6]
- **Test Requirements**:
  - `programmatic` TR-1.1: 类型定义文件能够正确编译
  - `human-judgement` TR-1.2: Mock 数据结构符合用户提供的示例格式
- **Notes**: 参考用户提供的 JSON 示例创建类型定义

## [ ] Task 2: 创建 MemoryPlayground 页面组件框架
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 apps/web/src/pages/ 目录下创建 MemoryPlayground.tsx
  - 实现基础的左右分栏布局（70% vs 30%）
  - 使用 @arco-design/web-react 组件构建页面框架
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3]
- **Test Requirements**:
  - `programmatic` TR-2.1: 组件文件能够正确编译
  - `human-judgement` TR-2.2: 左右分栏布局正确显示
- **Notes**: 参考现有页面组件的代码风格

## [ ] Task 3: 添加路由配置
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 在 App.tsx 中导入 MemoryPlayground 组件
  - 添加路由 /self_help/memory_playground
  - 确保路由受 ProtectedRoute 保护
  - 在 Home 组件中添加导航链接
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-3.1: 路由配置能够正确编译
  - `human-judgement` TR-3.2: 能够通过导航链接访问新页面
- **Notes**: 参考现有路由的配置方式

## [ ] Task 4: 实现对话区域组件
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 在左侧 70% 区域实现对话功能
  - 参考 AgentCallChat.tsx 的实现
  - 接入现有的 chatCompletionsStream API
  - 支持消息输入、发送和展示
  - 支持 Markdown 渲染
  - 支持流式响应展示
- **Acceptance Criteria Addressed**: [AC-2, AC-4]
- **Test Requirements**:
  - `programmatic` TR-4.1: 对话组件能够正确编译
  - `human-judgement` TR-4.2: 能够发送消息并看到 LLM 回复
  - `human-judgement` TR-4.3: Markdown 内容能够正确渲染
  - `human-judgement` TR-4.4: 流式响应能够正常展示
- **Notes**: 使用现有的 arkApi.ts 中的 chatCompletionsStream 函数

## [ ] Task 5: 实现记忆展示组件
- **Priority**: P0
- **Depends On**: Task 1, Task 2
- **Description**: 
  - 创建可复用的记忆展示组件
  - 在右侧 30% 区域上下分栏展示
  - 上方展示短期记忆，下方展示长期记忆
  - 采用卡片式布局展示记忆数据
  - 正确处理数组类型的值
- **Acceptance Criteria Addressed**: [AC-3, AC-5, AC-6]
- **Test Requirements**:
  - `programmatic` TR-5.1: 记忆展示组件能够正确编译
  - `human-judgement` TR-5.2: 短期记忆和长期记忆正确展示
  - `human-judgement` TR-5.3: 数组类型的值正确格式化显示
- **Notes**: 记忆展示采用清晰的键值对形式

## [ ] Task 6: 集成和测试完整功能
- **Priority**: P1
- **Depends On**: Task 3, Task 4, Task 5
- **Description**: 
  - 将所有组件集成到 MemoryPlayground 页面
  - 测试页面完整功能
  - 检查响应式布局
  - 确保代码符合项目规范
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4, AC-5, AC-6]
- **Test Requirements**:
  - `programmatic` TR-6.1: 运行 npm run build 无错误
  - `human-judgement` TR-6.2: 页面功能完整且体验良好
  - `human-judgement` TR-6.3: 代码风格一致，符合项目规范
- **Notes**: 进行全面的手动测试
