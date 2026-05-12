#!/bin/bash

# 脚本仅供参考，核心逻辑是：把构建产物，移动到 output 目录

# 切换node版本
# source /etc/profile # 在非标准环境中可能导致报错，视具体环境开启
echo "node version is $(node -v)"


echo "Installing dependencies..."
npm cache clean --force
npm install --registry=https://registry.npmjs.org --no-shrinkwrap

echo "Building..."
# 显式设置环境变量，确保使用正确的线上地址
cd apps/web && \
  VITE_API_BASE_URL=https://dupe.bytedance.net/self_help/api/agent_call \
  VITE_REAL_API_BASE_URL=https://dupe.bytedance.net/self_help/api/agent_call \
  npm run build && cd .. && cd ..



# 处理产物
echo "Preparing output..."
rm -rf output
mkdir -p output

# 将 apps/web 的构建产物复制到 output/dist
if [ -d "apps/web/dist" ]; then
    # 保持与参考脚本一致的结构：output/dist
    cp -R apps/web/dist output/
    echo "Build artifacts copied to output/dist"
else
    echo "Error: apps/web/dist not found"
    exit 1
fi

# 检查 output 目录内容
ls -R output
