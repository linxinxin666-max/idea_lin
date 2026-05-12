# 批量评测功能 - 实现计划

## [x] Task 1: 更新步骤列表，添加批量评测步骤
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 ScriptCreate.tsx 和 ScriptEdit.tsx 中更新 steps 数组，添加「批量评测」
  - 更新 useCreateStore 中的最大步骤数
  - 更新 renderStep 函数，添加 case 6 的处理
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `human-judgement` TR-1.1: 检查步骤导航中是否显示「批量评测」
  - `human-judgement` TR-1.2: 检查是否可以通过步骤导航切换到批量评测
- **Notes**: 步骤顺序：基础信息 → 角色配置 → 对话设计 → 技能配置 → 预览确认 → 自动对话 → 批量评测

## [x] Task 2: 创建 StepBatchEvaluation 组件框架
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 创建 StepBatchEvaluation.tsx 组件文件
  - 创建 StepBatchEvaluation.css 样式文件
  - 参考现有步骤组件的代码风格和结构
  - 添加基本的页面布局（标题、描述等）
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - `human-judgement` TR-2.1: 检查组件是否正常渲染
  - `human-judgement` TR-2.2: 检查页面标题和描述是否正确显示

## [x] Task 3: 定义评测结果类型
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在 types/script.ts 或新建 types/batchEvaluation.ts 中定义类型
  - 根据用户提供的接口返回示例定义完整的 TypeScript 类型
  - 包括 AccountInfo、ChatScoreDetail、ChatScoreFinal、MockChatResult 等类型
- **Acceptance Criteria Addressed**: [AC-5, AC-9]
- **Test Requirements**:
  - `programmatic` TR-3.1: 类型定义通过 TypeScript 编译检查
  - `human-judgement` TR-3.2: 类型定义与接口返回结构匹配

## [x] Task 4: 实现 batch_mock_chat 接口调用
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 在 services/arkApi.ts 中添加 batchMockChat 函数
  - 在 StepAutoChat 组件中添加进入批量评测的入口
  - 在 StepBatchEvaluation 组件的 useEffect 中调用接口
  - 确保调用不等待返回，异步触发
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `programmatic` TR-4.1: 检查接口是否正确被调用
  - `programmatic` TR-4.2: 检查参数是否正确传递（id）
  - `human-judgement` TR-4.3: 检查调用后是否立即继续执行，不阻塞

## [x] Task 5: 实现 get_mock_chat_result 接口调用和自动轮询
- **Priority**: P0
- **Depends On**: Task 4
- **Description**: 
  - 在 services/arkApi.ts 中添加 getMockChatResult 函数
  - 在 StepBatchEvaluation 组件中使用 setInterval 实现每分钟自动轮询
  - 正确清理定时器（组件卸载时清除）
  - 管理加载状态
- **Acceptance Criteria Addressed**: [AC-3, AC-4]
- **Test Requirements**:
  - `programmatic` TR-5.1: 检查接口是否每分钟自动调用
  - `programmatic` TR-5.2: 检查组件卸载时定时器是否被清除
  - `human-judgement` TR-5.3: 检查无数据时是否显示提示信息

## [x] Task 6: 实现评测结果表格展示
- **Priority**: P0
- **Depends On**: Task 5
- **Description**: 
  - 使用 Semi Design 的 Table 组件
  - 配置表格列：商家人设、模拟商家信息、完整对话文本、对话类型、总得分、明细得分
  - 对 account_info 等 JSON 字段进行友好展示
  - 添加表格样式
- **Acceptance Criteria Addressed**: [AC-5, AC-9]
- **Test Requirements**:
  - `human-judgement` TR-6.1: 检查表格是否正确展示所有字段
  - `human-judgement` TR-6.2: 检查 JSON 字段是否以友好格式展示
  - `human-judgement` TR-6.3: 检查表格样式是否美观

## [x] Task 7: 实现商家人设和对话类型筛选
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 在表格上方添加筛选组件
  - 商家人设筛选：使用 Select 组件，从数据中提取唯一值
  - 对话类型筛选：使用 Select 组件，从数据中提取唯一值
  - 实现筛选逻辑，更新表格数据
- **Acceptance Criteria Addressed**: [AC-6]
- **Test Requirements**:
  - `human-judgement` TR-7.1: 检查筛选组件是否正确显示
  - `human-judgement` TR-7.2: 检查筛选是否生效
  - `human-judgement` TR-7.3: 检查是否可以同时使用多个筛选条件

## [x] Task 8: 实现总得分排序
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 配置 Table 组件的 sorter 属性
  - 对总得分列启用排序功能
  - 支持升序和降序
- **Acceptance Criteria Addressed**: [AC-7]
- **Test Requirements**:
  - `human-judgement` TR-8.1: 检查总得分列是否有排序指示器
  - `human-judgement` TR-8.2: 检查点击排序是否生效
  - `human-judgement` TR-8.3: 检查升序和降序是否都正确

## [x] Task 9: 实现明细得分详情弹窗
- **Priority**: P1
- **Depends On**: Task 6
- **Description**: 
  - 在明细得分列添加点击事件
  - 使用 Semi Design 的 Modal 组件展示详情
  - 友好展示 chat_score_detail 的所有内容
  - 展示每个维度的得分、原因、建议等
- **Acceptance Criteria Addressed**: [AC-8, AC-9]
- **Test Requirements**:
  - `human-judgement` TR-9.1: 检查点击明细得分是否打开弹窗
  - `human-judgement` TR-9.2: 检查弹窗是否展示完整信息
  - `human-judgement` TR-9.3: 检查弹窗内容格式是否友好

## [x] Task 10: 更新 StepAutoChat，添加进入批量评测的按钮
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在 StepAutoChat 组件的底部操作区添加「进入批量评测」按钮
  - 点击按钮后调用 setCurrentStep(6) 切换到批量评测
  - 确保在创建模式和编辑模式下都能正常工作
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - `human-judgement` TR-10.1: 检查按钮是否正确显示
  - `human-judgement` TR-10.2: 检查点击按钮是否正确跳转到批量评测步骤
  - `human-judgement` TR-10.3: 检查在编辑模式下也能正常工作

## [x] Task 11: 完整功能测试和优化
- **Priority**: P2
- **Depends On**: Task 7, Task 8, Task 9, Task 10
- **Description**: 
  - 端到端测试整个流程
  - 优化用户体验
  - 修复发现的问题
  - 添加必要的错误处理
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9]
- **Test Requirements**:
  - `human-judgement` TR-11.1: 检查整个流程是否流畅
  - `human-judgement` TR-11.2: 检查错误处理是否完善
  - `human-judgement` TR-11.3: 检查用户体验是否良好
