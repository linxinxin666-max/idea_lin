# AgentCall 管理 Demo - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 创建 AgentCall 列表页组件
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 创建 AgentCallList 页面组件
  - 集成 useSSO hook 获取并展示用户信息
  - 使用 mock 数据展示 AgentCall 列表
  - 每个 AgentCall 项包含名称、描述、创建人字段
- **Acceptance Criteria Addressed**: [AC-1, AC-2]
- **Test Requirements**:
  - `human-judgement` TR-1.1: 页面正确展示用户头像、姓名、邮箱
  - `human-judgement` TR-1.2: AgentCall 列表正确渲染，包含所有必要字段
- **Notes**: 使用 Arco Design 的 Card 和 List 组件

## [x] Task 2: 创建 AgentCall 类型定义和 mock 数据
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 定义 AgentCall 接口类型
  - 创建 mock AgentCall 数据
  - 定义配置按钮的跳转链接配置
- **Acceptance Criteria Addressed**: [AC-2, AC-4]
- **Test Requirements**:
  - `programmatic` TR-2.1: TypeScript 类型定义正确无错误
  - `human-judgement` TR-2.2: mock 数据包含完整的 AgentCall 信息
- **Notes**: 配置链接使用占位符，后续可替换

## [x] Task 3: 添加新建 AgentCall 按钮和跳转功能
- **Priority**: P0
- **Depends On**: [Task 1]
- **Description**: 
  - 在列表页右上角添加「新建 AgentCall」按钮
  - 配置路由跳转逻辑
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - `programmatic` TR-3.1: 点击按钮正确跳转到新建页面路由
- **Notes**: 使用 React Router 的 useNavigate hook

## [x] Task 4: 添加 AgentCall 配置按钮
- **Priority**: P0
- **Depends On**: [Task 1, Task 2]
- **Description**: 
  - 为每个 AgentCall 项添加 4 个配置按钮
  - 实现按钮点击跳转功能
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `programmatic` TR-4.1: 每个按钮点击后跳转到对应配置链接
- **Notes**: 按钮可以在新标签页打开

## [x] Task 5: 创建新建 AgentCall 页面组件
- **Priority**: P0
- **Depends On**: [Task 3]
- **Description**: 
  - 创建 CreateAgentCall 页面组件
  - 添加 AgentCall 名称和描述输入框
  - 添加返回按钮和提交按钮
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `human-judgement` TR-5.1: 页面正确展示表单输入框
  - `human-judgement` TR-5.2: 表单样式与项目风格一致
- **Notes**: 使用 Arco Design 的 Form 组件

## [x] Task 6: 配置路由和导航
- **Priority**: P0
- **Depends On**: [Task 1, Task 5]
- **Description**: 
  - 在 App.tsx 中添加新页面的路由配置
  - 将 AgentCall 列表页设为首页
  - 确保所有路由都受 ProtectedRoute 保护
- **Acceptance Criteria Addressed**: [AC-1, AC-3]
- **Test Requirements**:
  - `programmatic` TR-6.1: 所有路由正确配置，访问对应 URL 显示正确页面
  - `programmatic` TR-6.2: 未登录用户被重定向到登录页
- **Notes**: 路由路径建议使用 /self_help/agent_call 前缀

## [x] Task 7: 验证和测试
- **Priority**: P1
- **Depends On**: [Task 1, Task 2, Task 3, Task 4, Task 5, Task 6]
- **Description**: 
  - 运行 lint 和 typecheck 检查
  - 手动测试所有功能点
  - 验证 UI 一致性
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4, AC-5]
- **Test Requirements**:
  - `programmatic` TR-7.1: npm run build 成功，无 TypeScript 错误
  - `programmatic` TR-7.2: ESLint 检查通过
  - `human-judgement` TR-7.3: 所有功能按需求正常工作
- **Notes**: 确保遵循项目 AGENTS.md 中的规范
