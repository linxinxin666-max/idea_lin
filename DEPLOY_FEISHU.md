# 飞书工作台小组件部署指南

本工具为纯静态页面，部署后在飞书工作台小组件中填写 URL 即可。

## 方案一：Vercel（推荐）

1. 将本项目推送到 Git 仓库。
2. 进入 Vercel 创建新项目并导入该仓库。
3. Framework Preset 选择 Other。
4. 部署完成后，使用如下地址作为飞书小组件 URL：
   - https://你的域名/demo.html

## 方案二：Cloudflare Pages

1. 将本项目推送到 Git 仓库。
2. 在 Cloudflare Pages 创建项目并关联仓库。
3. Build command 留空，Output directory 留空。
4. 部署完成后，使用如下地址作为飞书小组件 URL：
   - https://你的域名/demo.html

## 飞书工作台小组件配置

1. 进入飞书开放平台，选择你的应用。
2. 在「应用能力」里添加「工作台小组件」。
3. 小组件 URL 填入部署后的地址，例如：
   - https://你的域名/demo.html

## 提醒服务公网地址配置（可选）

如果你使用 `server.js` 或 `reminder-server.js` 发送飞书提醒，需要设置公网地址，按钮才会跳转到线上页面。

环境变量：

```
PUBLIC_BASE_URL=https://你的域名
```

示例启动：

```
PUBLIC_BASE_URL=https://你的域名 node server.js
```

## 内嵌被拦截时的排查

若页面无法内嵌，通常是服务端设置了 X-Frame-Options 或 CSP。请确保没有设置：

- X-Frame-Options: DENY
- X-Frame-Options: SAMEORIGIN

并允许飞书域名作为 frame-ancestors。
