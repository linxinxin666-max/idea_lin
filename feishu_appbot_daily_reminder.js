const https = require('https');
const fs = require('fs');
const path = require('path');

const PUBLIC_DEMO_URL_FILE = path.join(__dirname, 'public_demo_url.txt');

function readConfiguredDemoUrl() {
  try {
    const v = fs.readFileSync(PUBLIC_DEMO_URL_FILE, 'utf8').trim();
    return v ? v.replace(/\/+$/, '') : '';
  } catch (e) {
    return '';
  }
}

function requiredEnv(name) {
  const v = (process.env[name] || '').trim();
  if (!v) throw new Error(`缺少环境变量：${name}`);
  return v;
}

function optionalEnv(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function postJson(urlStr, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const data = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', (chunk) => (buf += chunk));
      res.on('end', () => {
        let parsed = buf;
        try {
          parsed = buf ? JSON.parse(buf) : null;
        } catch (e) {}
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function postAuthedJson(path, token, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', (chunk) => (buf += chunk));
      res.on('end', () => {
        let parsed = buf;
        try {
          parsed = buf ? JSON.parse(buf) : null;
        } catch (e) {}
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getTenantAccessToken(appId, appSecret) {
  const res = await postJson('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/', {
    app_id: appId,
    app_secret: appSecret
  });
  if (res.statusCode !== 200 || !res.body || res.body.code !== 0) {
    throw new Error(`获取tenant_access_token失败: ${JSON.stringify(res.body)}`);
  }
  return res.body.tenant_access_token;
}

function buildCard({ publicBaseUrl, publicDemoUrl }) {
  const fileUrl = readConfiguredDemoUrl();
  const demoUrl = (publicDemoUrl || '').trim().replace(/\/+$/, '') || fileUrl || ((publicBaseUrl || '').replace(/\/+$/, '') ? `${(publicBaseUrl || '').replace(/\/+$/, '')}/demo.html` : '');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const linkLine = demoUrl ? `\n\n🔗 工具入口：${demoUrl}` : '';

  const elements = [
    {
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `**⏰ 12:00 提醒**\n\n今天（${dateStr}）记得发布朋友圈～\n\n建议动作：\n1️⃣ 打开素材工具挑一条「经营技巧 / 直播动态」\n2️⃣ 复制文案 + 保存封面图\n3️⃣ 去企微朋友圈发布${linkLine}`
      }
    }
  ];

  if (demoUrl) {
    elements.push({ tag: 'hr' });
    elements.push({
      tag: 'action',
      actions: [
        { tag: 'button', type: 'primary', text: { tag: 'plain_text', content: '打开素材工具' }, url: demoUrl }
      ]
    });
  }

  return {
    config: { wide_screen_mode: true },
    header: { template: 'blue', title: { tag: 'plain_text', content: '📱 朋友圈发布提醒' } },
    elements
  };
}

async function sendToChat({ tenantToken, chatId, card }) {
  const path = `/open-apis/im/v1/messages?receive_id_type=chat_id`;
  const payload = {
    receive_id: chatId,
    msg_type: 'interactive',
    content: JSON.stringify(card)
  };
  const res = await postAuthedJson(path, tenantToken, payload);
  if (res.statusCode !== 200 || !res.body || res.body.code !== 0) {
    throw new Error(`发送消息失败(chat_id=${chatId}): ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!dryRun && String(process.env.ENABLE_FEISHU_APPBOT_REMINDER || '').trim() !== 'true') {
    process.stdout.write('已禁用应用机器人提醒（如需启用请设置 ENABLE_FEISHU_APPBOT_REMINDER=true）\n');
    return;
  }
  const appId = dryRun ? optionalEnv('FEISHU_APP_ID', 'cli_xxx') : requiredEnv('FEISHU_APP_ID');
  const appSecret = dryRun ? optionalEnv('FEISHU_APP_SECRET', 'secret_xxx') : requiredEnv('FEISHU_APP_SECRET');
  const chatIdsRaw = dryRun ? optionalEnv('FEISHU_CHAT_IDS', 'oc_xxx') : requiredEnv('FEISHU_CHAT_IDS');
  const publicBaseUrl = optionalEnv('PUBLIC_BASE_URL', '');
  const publicDemoUrl = optionalEnv('PUBLIC_DEMO_URL', '');

  const chatIds = chatIdsRaw.split(',').map(s => s.trim()).filter(Boolean);
  if (chatIds.length === 0) throw new Error('FEISHU_CHAT_IDS 不能为空');

  const card = buildCard({ publicBaseUrl, publicDemoUrl });
  if (dryRun) {
    process.stdout.write(JSON.stringify({ chatIds, card }, null, 2) + '\n');
    return;
  }

  const tenantToken = await getTenantAccessToken(appId, appSecret);
  const results = [];
  for (const chatId of chatIds) {
    const r = await sendToChat({ tenantToken, chatId, card });
    results.push({ chatId, ok: true, data: r });
  }
  process.stdout.write(JSON.stringify({ ok: true, results }, null, 2) + '\n');
}

main().catch((e) => {
  process.stderr.write(String(e && e.stack ? e.stack : e) + '\n');
  process.exit(1);
});
