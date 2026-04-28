# Idea Creator - 朋友圈素材生成器

## 功能介绍

为抖音生活服务销售顾问设计的朋友圈素材生成工具，支持：
- 多种人设选择（专业顾问、亲切伙伴、行业专家、活力满满）
- 多种内容类型（官方发布、经营技巧、成功案例、平台动态、节日问候、励志鸡汤）
- 自动生成朋友圈素材
- 微信朋友圈预览
- 一键复制文案
- **飞书提醒订阅**（新功能）

## 快速开始

### 1. 打开网页

直接在浏览器中打开 `demo.html` 文件即可使用。

### 2. 生成素材

1. 选择一个人设
2. 选择一个内容类型
3. 系统会自动生成朋友圈素材
4. 点击「🔄 换一个」可以重新生成
5. 点击「📋 复制文案」可以复制到剪贴板

### 3. 设置飞书提醒

#### 前置准备

1. 在飞书群聊中创建一个自定义机器人（或将已有机器人拉进群）
2. 复制机器人的 Webhook 地址

#### 设置步骤

1. 在「飞书提醒订阅」板块选择发布频率（每个工作日/每2个工作日/.../每5个工作日）
2. 输入飞书机器人的 Webhook 地址
3. 点击「开启提醒」

#### 启动提醒服务（重要！）

要实际收到飞书提醒，需要启动Node.js服务：

```bash
# 确保已安装Node.js
node reminder-server.js
```

服务启动后会在 `http://localhost:3000` 运行，每分钟检查一次提醒任务。

## 每天 12:00 群提醒（推荐做法）

如果你希望固定每天中午 12:00 在群里提醒发布朋友圈，有两种机器人形态：

### A. 群自定义机器人（Webhook）

1. 把“朋友圈发布提醒”机器人拉进目标群聊
2. 在群聊里为该机器人生成 Webhook（可选开启「签名校验」）
3. 用定时任务（cron / 服务器 / CI）每天 12:00 调用发送脚本

项目里提供了脚本：

```bash
FEISHU_WEBHOOK='https://open.feishu.cn/open-apis/bot/v2/hook/xxx' \
PUBLIC_BASE_URL='https://你的域名' \
node feishu_daily_reminder.js
```

如果机器人开启了“签名校验”，再加上：

```bash
FEISHU_SECRET='你的签名密钥'
```

macOS 本地定时（示例，12:00）：

```bash
crontab -e
```

添加一行（把路径替换为你的实际目录）：

```bash
0 12 * * * cd /Users/bytedance/Documents/trae_projects/idea_lin && FEISHU_WEBHOOK='...' PUBLIC_BASE_URL='https://你的域名' /usr/local/bin/node feishu_daily_reminder.js >/tmp/feishu_reminder.log 2>&1
```

### B. 飞书应用机器人（App Bot，推荐用于多群/统一管控）

应用机器人不走 webhook，需要使用应用的 `app_id/app_secret` 获取 `tenant_access_token`，再通过 OpenAPI 往指定群聊（chat_id）发消息。

前置准备：

1. 在飞书开放平台打开你的应用，确保已开启「机器人」能力
2. 给应用加权限（至少需要“发送消息到群聊”的相关权限），并完成发布/可用范围配置
3. 把应用机器人拉进目标群聊（否则通常无法向该群发送消息）
4. 拿到目标群的 `chat_id`（常见获取方式：在群里让机器人收到一条消息/被拉群事件后从事件回调拿到；或在开放平台工具里查看群信息）

项目里提供了应用机器人发送脚本：

```bash
FEISHU_APP_ID='cli_xxx' \
FEISHU_APP_SECRET='xxx' \
FEISHU_CHAT_IDS='oc_xxx,oc_yyy' \
PUBLIC_BASE_URL='https://你的域名' \
node feishu_appbot_daily_reminder.js
```

macOS 本地定时（示例，12:00）：

```bash
0 12 * * * cd /Users/bytedance/Documents/trae_projects/idea_lin && FEISHU_APP_ID='cli_xxx' FEISHU_APP_SECRET='xxx' FEISHU_CHAT_IDS='oc_xxx,oc_yyy' PUBLIC_BASE_URL='https://你的域名' /usr/local/bin/node feishu_appbot_daily_reminder.js >/tmp/feishu_appbot_reminder.log 2>&1
```

## 文件说明

- `demo.html` - 主程序文件，包含完整的UI和逻辑
- `reminder-server.js` - Node.js定时提醒服务
- `subscriptions.json` - 订阅数据存储文件（自动生成）

## 注意事项

1. 提醒服务需要保持运行才能发送提醒
2. Webhook地址请确保有效且有发送消息的权限
3. 提醒只在工作日（周一至周五）发送
4. 订阅数据会保存在浏览器本地和服务器上
