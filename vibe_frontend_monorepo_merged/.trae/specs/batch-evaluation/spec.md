# 批量评测功能 - 产品需求文档

## Overview
- **Summary**: 在剧本创建和编辑流程中增加「批量评测」步骤，用于通过批量模拟对话来评测剧本质量，支持筛选、排序和查看详细评测结果
- **Purpose**: 提供全面的剧本评测功能，让用户能够通过多种角色场景的模拟对话，了解剧本在不同场景下的表现，从而优化剧本配置
- **Target Users**: 剧本创建者、运营人员、测试人员

## Goals
- 在现有流程的「自动对话」步骤后增加「批量评测」步骤
- 提供批量模拟对话的触发机制
- 展示评测结果的表格，包含所需字段
- 支持商家人设和对话类型筛选
- 支持总得分排序
- 支持查看明细得分详情
- 对接口返回的JSON字段进行友好的前端展示

## Non-Goals (Out of Scope)
- 不支持自定义评测角色
- 不支持手动编辑评测结果
- 不支持导出评测报告
- 不支持历史评测记录查看

## Background & Context
- 当前已有完整的剧本创建和编辑流程，包括基础信息、角色配置、对话设计、技能配置、预览确认、自动对话等步骤
- 已有 StepAutoChat 组件用于单个角色的模拟对话
- 项目使用 React 19 + TypeScript + Zustand + Semi Design UI 组件库
- 已有 batch_mock_chat 和 get_mock_chat_result 后端接口

## Functional Requirements
- **FR-1**: 增加「批量评测」步骤到步骤列表中
- **FR-2**: 从自动对话进入批量评测时调用 batch_mock_chat 接口
- **FR-3**: 在批量评测页每隔一分钟自动调用 get_mock_chat_result 获取结果
- **FR-4**: 展示评测结果表格，包含商家人设、模拟商家信息、完整对话文本、对话类型、总得分、明细得分字段
- **FR-5**: 支持商家人设和对话类型筛选
- **FR-6**: 支持总得分排序
- **FR-7**: 明细得分支持点击查看完整信息
- **FR-8**: 对JSON格式的接口返回字段进行前端优化展示

## Non-Functional Requirements
- **NFR-1**: 页面加载时间不超过3秒
- **NFR-2**: 表格滚动流畅，无明显卡顿
- **NFR-3**: 自动轮询不影响页面其他功能

## Constraints
- **Technical**: 使用现有技术栈（React 19, TypeScript, Zustand, Semi Design）
- **Business**: 需要复用现有的剧本ID
- **Dependencies**: 依赖 batch_mock_chat 和 get_mock_chat_result 后端接口

## Assumptions
- batch_mock_chat 接口会在调用后异步处理，不会立即返回结果
- get_mock_chat_result 接口在无数据时会返回空数组或状态码
- 评测结果的JSON结构如用户示例所示

## Acceptance Criteria

### AC-1: 新增批量评测步骤
- **Given**: 用户在剧本创建或编辑流程中
- **When**: 查看步骤导航
- **Then**: 可以看到「批量评测」步骤在「自动对话」之后
- **Verification**: `human-judgment`

### AC-2: 调用批量模拟对话接口
- **Given**: 用户在「自动对话」步骤点击进入批量评测
- **When**: 进入「批量评测」步骤
- **Then**: 自动调用 batch_mock_chat 接口，参数为剧本ID，不等待返回
- **Verification**: `programmatic`

### AC-3: 自动轮询获取评测结果
- **Given**: 用户在「批量评测」页面
- **When**: 页面加载后
- **Then**: 每隔一分钟自动调用 get_mock_chat_result 接口，参数为剧本ID
- **Verification**: `programmatic`

### AC-4: 显示加载提示
- **Given**: get_mock_chat_result 接口返回空数据
- **When**: 页面显示
- **Then**: 提示「评测结果正在生成中，请稍等页面自动更新」
- **Verification**: `human-judgment`

### AC-5: 展示评测结果表格
- **Given**: get_mock_chat_result 接口返回了评测数据
- **When**: 页面显示
- **Then**: 以表格形式展示数据，包含商家人设、模拟商家信息、完整对话文本、对话类型、总得分、明细得分字段
- **Verification**: `human-judgment`

### AC-6: 商家人设和对话类型筛选
- **Given**: 表格中有多条评测数据
- **When**: 用户选择商家人设或对话类型筛选条件
- **Then**: 表格只显示符合条件的数据
- **Verification**: `human-judgment`

### AC-7: 总得分排序
- **Given**: 表格中有多条评测数据
- **When**: 用户点击总得分列进行排序
- **Then**: 表格按总得分升序或降序排列
- **Verification**: `human-judgment`

### AC-8: 查看明细得分详情
- **Given**: 表格中有明细得分数据
- **When**: 用户点击明细得分列
- **Then**: 弹出弹窗或展开区域显示完整的明细得分信息
- **Verification**: `human-judgment`

### AC-9: JSON字段优化展示
- **Given**: 接口返回JSON格式的字段（如account_info、chat_score_detail等）
- **When**: 页面展示这些字段
- **Then**: 以友好的格式展示，而不是原始JSON字符串
- **Verification**: `human-judgment`

## Open Questions
- [ ] batch_mock_chat 接口是否有额外参数需要传递？
- [ ] get_mock_chat_result 接口是否支持分页？
- [ ] 是否需要用户手动停止自动轮询？
- [ ] 明细得分详情弹窗需要展示哪些具体信息？
