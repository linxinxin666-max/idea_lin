# UI 组件实现调整（参考 feat_ui_optimization_test） Spec

## Why
当前分支的页面 UI 组件实现与参考分支存在差异，需要统一到参考分支的表现与结构，以提升一致性与可维护性。

## What Changes
- 对齐页面级 UI 组件的结构、布局与样式实现，参考 feat_ui_optimization_test 分支
- 调整公共组件的使用方式与组合关系以匹配参考实现
- 更新页面级与组件级样式组织方式以符合参考实现

## Impact
- Affected specs: 页面 UI 组件一致性、组件复用与样式体系一致性
- Affected code: apps/web 下的页面与 UI 组件实现

## ADDED Requirements
### Requirement: 参考分支对齐
系统 SHALL 在目标页面中采用与 feat_ui_optimization_test 分支一致的 UI 组件结构、布局与样式实现。

#### Scenario: 成功对齐
- **WHEN** 打开目标页面
- **THEN** 页面 UI 结构、布局与样式与参考分支一致

## MODIFIED Requirements
### Requirement: 页面 UI 组件实现
系统 SHALL 调整目标页面与其依赖组件的实现细节，以匹配参考分支的组件组合、样式组织与交互表现。

## REMOVED Requirements
### Requirement: 旧版页面 UI 结构
**Reason**: 与参考分支表现不一致
**Migration**: 用参考分支的组件结构与样式组织替换旧实现
