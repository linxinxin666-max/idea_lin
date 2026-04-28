const https = require('https');

const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || 'https://idea-lin.vercel.app').replace(/\/+$/, '');

const message = {
  msg_type: 'interactive',
  card: {
    config: {
      wide_screen_mode: true
    },
    header: {
      template: 'blue',
      title: {
        content: '📱 朋友圈发布提醒（测试版）',
        tag: 'plain_text'
      }
    },
    elements: [
      {
        tag: 'div',
        text: {
          content: '**⏰ 测试时间到啦！**\n\n这是我们的飞书机器人测试卡片，赶紧看看效果吧！',
          tag: 'lark_md'
        }
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: {
          content: '**🔥 今日官方推荐**\n\n📢 🔥 今日官方内容推荐\n\n抖音生活服务最新商家入门直播课名额告急',
          tag: 'lark_md'
        }
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '直接打开官方推荐文案' },
            type: 'primary',
            url: `${PUBLIC_BASE_URL}/demo.html?officialId=latest-1&persona=professional&contentType=official`
          }
        ]
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: {
          content: '**👤 选择人设和内容类型',
          tag: 'plain_text'
        }
      },
      {
        tag: 'action',
        actions: [
          { tag: 'button', text: { tag: 'plain_text', content: '专业顾问' }, type: 'default', url: `${PUBLIC_BASE_URL}/demo.html?persona=professional&contentType=official` },
          { tag: 'button', text: { tag: 'plain_text', content: '亲切伙伴' }, type: 'default', url: `${PUBLIC_BASE_URL}/demo.html?persona=friendly&contentType=official` },
          { tag: 'button', text: { tag: 'plain_text', content: '行业专家' }, type: 'default', url: `${PUBLIC_BASE_URL}/demo.html?persona=expert&contentType=official` },
          { tag: 'button', text: { tag: 'plain_text', content: '活力满满' }, type: 'default', url: `${PUBLIC_BASE_URL}/demo.html?persona=cheerful&contentType=official` }
        ]
      },
      {
        tag: 'action',
        actions: [
          { tag: 'button', text: { tag: 'plain_text', content: '官方发布' }, type: 'default', url: `${PUBLIC_BASE_URL}/demo.html?persona=professional&contentType=official` },
          { tag: 'button', text: { tag: 'plain_text', content: '经营技巧' }, type: 'default', url: `${PUBLIC_BASE_URL}/demo.html?persona=professional&contentType=tip` },
          { tag: 'button', text: { tag: 'plain_text', content: '成功案例' }, type: 'default', url: `${PUBLIC_BASE_URL}/demo.html?persona=professional&contentType=success` }
        ]
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: {
          content: '**💡 其他选择',
          tag: 'plain_text'
        }
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '打开 Idea Creator 主页' },
            type: 'primary',
            url: `${PUBLIC_BASE_URL}/demo.html`
          }
        ]
      }
    ]
  }
};

const webhook = process.env.FEISHU_WEBHOOK;
if (!webhook) {
  console.error('缺少环境变量 FEISHU_WEBHOOK');
  process.exit(1);
}

const url = new URL(webhook);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('发送成功！');
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(JSON.stringify(message));
req.end();
