# AgentCall 自动对话 - The Implementation Plan (Decomposed and Prioritized Task List)

## [x] Task 1: 添加用户侧PE获取功能
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在页面初始化时调用mock_character_pe接口
  - 传入当前选择的模拟角色身份
  - 保存返回的character_pe到状态中
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `programmatic` TR-1.1: 页面初始化时检查是否调用了mock_character_pe接口
  - `programmatic` TR-1.2: 接口参数包含正确的character字段
  - `programmatic` TR-1.3: 返回的character_pe被正确保存到状态
- **Notes**: 需要处理接口调用失败的情况

## [x] Task 2: 实现自动对话循环逻辑
- **Priority**: P0
- **Depends On**: [Task 1]
- **Description**: 
  - 创建自动对话函数
  - 实现AI→用户→AI的循环调用
  - 使用chatCompletionsStream分别调用两个角色
  - 管理对话状态
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `programmatic` TR-2.1: 对话循环能够正确执行AI→用户→AI的调用
  - `programmatic` TR-2.2: 对话消息能够正确添加到messages状态
  - `programmatic` TR-2.3: 对话历史能够正确展示
- **Notes**: 注意处理异步调用和状态更新

## [x] Task 3: 实现对话结束条件检测
- **Priority**: P0
- **Depends On**: [Task 2]
- **Description**: 
  - 检测用户侧回复是否包含「挂断」
  - 检测AI侧回复是否包含结束语
  - 检测对话轮次是否超过20次
  - 满足任一条件时终止对话
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - `programmatic` TR-3.1: 用户回复包含「挂断」时能正确终止
  - `programmatic` TR-3.2: AI回复包含结束语时能正确终止
  - `programmatic` TR-3.3: 对话超过20轮时能正确强制终止
- **Notes**: 结束语需要从agent_config中获取

## [x] Task 4: 移除用户输入框并优化UI
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 移除用户输入框相关的UI元素
  - 保留重新开始按钮
  - 优化页面布局，确保对话展示完整
- **Acceptance Criteria Addressed**: [AC-4]
- **Test Requirements**:
  - `human-judgement` TR-4.1: 页面中没有用户输入框
  - `human-judgement` TR-4.2: 页面中有重新开始按钮
  - `human-judgement` TR-4.3: 对话展示区域布局合理
- **Notes**: 保持页面整体风格一致

## [x] Task 5: 实现重新开始功能
- **Priority**: P1
- **Depends On**: [Task 3]
- **Description**: 
  - 创建重新开始对话函数
  - 清空对话历史和相关状态
  - 重新获取用户PE并开始新对话
- **Acceptance Criteria Addressed**: [AC-5]
- **Test Requirements**:
  - `programmatic` TR-5.1: 点击重新开始按钮能清空对话历史
  - `programmatic` TR-5.2: 重新开始后能正确获取用户PE
  - `programmatic` TR-5.3: 重新开始后能自动开始新对话
- **Notes**: 需要重置所有相关状态变量

## [x] Task 6: 优化对话展示体验
- **Priority**: P2
- **Depends On**: [Task 2]
- **Description**: 
  - 确保对话消息正确展示
  - 保持现有的样式和交互
  - 可能需要添加加载状态指示
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `human-judgement` TR-6.1: AI和用户的消息都能正确展示
  - `human-judgement` TR-6.2: 消息样式与原页面保持一致
  - `human-judgement` TR-6.3: 对话过程中的加载状态友好
- **Notes**: 保持现有对话展示的所有功能
