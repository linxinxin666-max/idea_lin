# AgentCall 自动对话 - Product Requirement Document

## Overview
- **Summary**: 为AgentCall对话预览页添加自动对话能力，使用模拟角色身份自动进行多轮对话，模拟真实的外呼场景
- **Purpose**: 无需用户手动输入，自动模拟真实外呼场景，快速验证Agent配置的效果
- **Target Users**: 运营人员、产品经理

## Goals
- 从配置页进入对话预览页时，自动获取用户侧PE
- 自动进行AI→用户→AI的多轮对话
- 根据设定的结束条件自动终止对话
- 去掉用户输入框，完全自动模拟
- 提供重新开始对话功能

## Non-Goals (Out of Scope)
- 不需要用户手动输入对话内容
- 不需要手动控制对话流程
- 不涉及后端对话存储

## Background & Context
- 现有对话预览页需要用户手动输入，效率较低
- 已有模拟角色身份的配置（爽快配合型、忙碌敷衍型等）
- 已有AI外呼配置的完整数据

## Functional Requirements
- **FR-1**: 进入对话预览页时，调用mock_character_pe接口获取用户侧PE
- **FR-2**: 自动发起AI→用户→AI的多轮对话循环
- **FR-3**: 实现对话结束条件检测（用户侧挂断、AI结束语、超过20轮）
- **FR-4**: 移除用户输入框，完全自动模拟
- **FR-5**: 提供重新开始对话按钮
- **FR-6**: 展示完整的对话历史记录

## Non-Functional Requirements
- **NFR-1**: 对话自动进行，无需用户干预
- **NFR-2**: 对话展示实时更新
- **NFR-3**: 界面简洁，易于观察对话过程

## Constraints
- **Technical**: 使用React 19、TypeScript、@arco-design/web-react
- **Dependencies**: mock_character_pe接口、chatCompletionsStream接口
- **External APIs**: http://localhost:8001/self_help/agent_call/mock_character_pe

## Assumptions
- mock_character_pe接口返回的character_pe格式稳定
- 配置的结束语已在agent_config中正确设置
- 模拟角色身份已在simulatedRole状态中正确选择

## Acceptance Criteria

### AC-1: 自动获取用户PE
- **Given**: 用户从编辑页进入对话预览页
- **When**: 页面初始化完成
- **Then**: 自动调用mock_character_pe接口，传入当前选择的模拟角色身份
- **Verification**: `programmatic`
- **Notes**: 接口参数包含character字段

### AC-2: 自动对话循环
- **Given**: 已获取用户侧PE和有开场白
- **When**: 页面加载完成
- **Then**: 自动开始AI→用户→AI的对话循环
- **Verification**: `programmatic`
- **Notes**: 使用chatCompletionsStream分别调用AI和用户角色

### AC-3: 结束条件检测
- **Given**: 对话正在进行中
- **When**: 用户侧回复包含「挂断」，或AI侧回复包含结束语，或对话轮次超过20次
- **Then**: 自动终止对话
- **Verification**: `programmatic`

### AC-4: 移除用户输入框
- **Given**: 对话预览页面
- **When**: 查看页面布局
- **Then**: 没有用户输入框，只有对话展示区域和重新开始按钮
- **Verification**: `human-judgment`

### AC-5: 重新开始功能
- **Given**: 对话已结束或正在进行中
- **When**: 点击重新开始按钮
- **Then**: 清空对话历史，重新开始新的对话
- **Verification**: `programmatic`

### AC-6: 对话展示
- **Given**: 对话正在进行或已结束
- **When**: 查看页面
- **Then**: 清晰展示AI和用户的所有对话消息
- **Verification**: `human-judgment`

## Open Questions
- [ ] 用户侧PE和AI侧PE的调用是否需要完全隔离？
- [ ] 是否需要在对话过程中显示加载状态？
- [ ] 对话结束后是否需要总结或导出功能？
