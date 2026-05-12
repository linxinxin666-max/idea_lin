# Vibe Frontend Monorepo

## 项目背景

本仓库是自助生服团队用来统一放置VibeCoding项目并进行内网域名分发的前端monorepo仓库。通过此仓库，团队可以集中管理多个VibeCoding相关的前端项目，并通过统一的域名进行访问。

## 访问信息

- **访问域名**：https://dupe.bytedance.net/self_help/
- **代码仓库**：https://code.byted.org/wangjunjie.09/vibe_frontend_monorepo
- **Goofy部署地址**：https://deploy.bytedance.net/app/90826/deploy_unit_list?deployUnitId=144588&x-resource-account=public

## 项目结构

```
vibe_frontend_monorepo/
├── apps/              # 应用目录
│   ├── web/           # 主Web应用
│   └── [其他应用]/     # 其他VibeCoding相关应用
├── packages/          # 共享包
│   ├── components/    # 共享组件
│   └── utils/         # 共享工具函数
├── scripts/           # 脚本文件
├── package.json       # 根项目配置
└── README.md          # 项目说明文档
```

## 开发规则

### 1. 代码规范

- 遵循团队统一的ESLint和Prettier配置
- 提交代码前确保通过所有代码规范检查
- 代码注释清晰，关键逻辑必须有注释说明

### 2. 分支管理

- `main`：主分支，用于生产环境部署
- `develop`：开发分支，集成所有功能开发
- `feature/*`：功能分支，用于开发新功能
- `fix/*`：修复分支，用于修复bug

### 3. 提交规范

- 提交信息遵循以下格式：`[类型]: 描述`
  - `feat`：新功能
  - `fix`：bug修复
  - `docs`：文档更新
  - `style`：代码风格调整
  - `refactor`：代码重构
  - `test`：测试相关
  - `chore`：构建或依赖更新

### 4. 开发流程

1. 从`develop`分支创建功能分支
2. 在功能分支上进行开发
3. 开发完成后，提交PR到`develop`分支
4. 代码审查通过后，合并到`develop`分支
5. 定期从`develop`分支合并到`main`分支进行部署

### 5. 依赖管理

- 使用根目录的`package.json`统一管理依赖
- 新添加依赖时，需要在根目录执行安装命令
- 保持依赖版本的一致性，避免版本冲突

## 开发环境搭建

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装特定应用依赖
cd apps/web
npm install
```

### 2. 启动开发服务器

```bash
# 启动所有应用
npm run dev

# 启动特定应用
cd apps/web
npm run dev
```

## 构建与部署

### 1. 构建项目

```bash
# 构建所有应用
npm run build

# 构建特定应用
cd apps/web
npm run build
```

### 2. 部署流程

1. 确保代码已合并到`main`分支
2. 登录Goofy部署平台（地址见上方）
3. 选择对应部署单元，点击部署按钮
4. 等待部署完成并验证

## 常见问题

### 1. 依赖安装失败

- 检查网络连接
- 确保使用正确的npm源
- 尝试清除npm缓存后重新安装

### 2. 构建失败

- 检查代码是否符合规范
- 确保所有依赖已正确安装
- 查看构建日志获取详细错误信息

## 联系信息

如有问题，请联系自助生服团队。