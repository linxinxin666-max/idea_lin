const https = require('https');
const crypto = require('crypto');

function requiredEnv(name) {
  const v = (process.env[name] || '').trim();
  if (!v) throw new Error(`缺少环境变量：${name}`);
  return v;
}

function optionalEnv(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function buildSignature(secret, timestampSeconds) {
  const stringToSign = `${timestampSeconds}\n${secret}`;
  return crypto.createHmac('sha256', stringToSign).digest('base64');
}

function postJson(webhook, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhook);
    const data = JSON.stringify(payload);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let buf = '';
      res.on('data', (chunk) => (buf += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: buf ? JSON.parse(buf) : null });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: buf });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function buildCardMessage({ publicBaseUrl }) {
  const baseUrl = (publicBaseUrl || '').replace(/\/+$/, '');
  const demoUrl = baseUrl ? `${baseUrl}/demo.html` : '';
  const title = '📱 朋友圈发布提醒';
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const elements = [
    {
      tag: 'div',
      text: {
        content: `**⏰ 12:00 提醒**\n\n今天（${dateStr}）记得发布朋友圈～\n\n建议动作：\n1️⃣ 打开素材工具挑一条「经营技巧 / 直播动态」\n2️⃣ 复制文案 + 保存封面图\n3️⃣ 去企微朋友圈发布`,
        tag: 'lark_md'
      }
    }
  ];

  if (demoUrl) {
    elements.push({ tag: 'hr' });
    elements.push({
      tag: 'action',
      actions: [
        {
          tag: 'button',
          text: { tag: 'plain_text', content: '打开素材工具（经营技巧）' },
          type: 'primary',
          url: `${demoUrl}`
        }
      ]
    });
  }

  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: { template: 'blue', title: { content: title, tag: 'plain_text' } },
      elements
    }
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const webhook = dryRun ? optionalEnv('FEISHU_WEBHOOK', 'https://open.feishu.cn/open-apis/bot/v2/hook/xxx') : requiredEnv('FEISHU_WEBHOOK');
  const secret = optionalEnv('FEISHU_SECRET', '');
  const publicBaseUrl = optionalEnv('PUBLIC_BASE_URL', '');

  const message = buildCardMessage({ publicBaseUrl });

  let payload = { ...message };
  if (secret) {
    const timestampSeconds = Math.floor(Date.now() / 1000);
    payload = {
      timestamp: String(timestampSeconds),
      sign: buildSignature(secret, timestampSeconds),
      ...message
    };
  }

  if (dryRun) {
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    return;
  }

  const res = await postJson(webhook, payload);
  process.stdout.write(JSON.stringify(res, null, 2) + '\n');
  if (res.statusCode && res.statusCode >= 400) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  process.stderr.write(String(e && e.stack ? e.stack : e) + '\n');
  process.exit(1);
});
