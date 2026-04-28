const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const DATA_FILE = path.join(__dirname, 'subscriptions.json');

function loadSubscriptions() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveSubscriptions(subscriptions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(subscriptions, null, 2));
}

function isWorkDay(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function calculateNextReminder(frequencyDays, lastReminder = null) {
  let startDate = lastReminder ? new Date(lastReminder) : new Date();
  let nextDate = new Date(startDate);
  
  let workDaysAdded = 0;
  while (workDaysAdded < frequencyDays) {
    nextDate.setDate(nextDate.getDate() + 1);
    if (isWorkDay(nextDate)) {
      workDaysAdded++;
    }
  }
  
  return nextDate;
}

async function sendFeishuReminder(webhook, subscription) {
  const freqLabel = {
    1: '每个工作日',
    2: '每2个工作日',
    3: '每3个工作日',
    4: '每4个工作日',
    5: '每5个工作日'
  };

  const officialContents = [
    {
      id: 'official-1',
      title: '🔥 今日官方内容推荐',
      desc: '抖音生活服务最新商家入门直播课名额告急',
      content: '亲！紧急通知！本月的【商家入门直播课】直播课仅剩最后5个名额！\n\n为什么这个课值得您专门抽出1小时？\n🔥 抖音官方讲师亲自授课，揭秘最新直播玩法\n🔥 现场拆解真实案例：从日销5000到日销5万的蜕变\n🔥 免费领取500元本地推券\n\n别再犹豫！现在预约还能获得：\n✅ 《直播系列课 学习开单秘籍》共22节小课学习\n✅ 专属业务经理全程指导\n✅ 优先获得官方最新政策解读\n\n#直播课程 #商家成长 #免费福利'
    },
    {
      id: 'official-2',
      title: '🍜 餐饮商家免费直播入门课',
      desc: '周二下午2点餐饮商家专属免费直播课',
      content: '各位团购经营的老板们看过来！是不是总刷到别人靠抖音直播涨客，自己却不知道从哪下手？这周二下午两点，官方专门给餐饮行业商家开的【免费直播入门课】来啦！手把手教你搞定抖音直播，从账号设置到首次开播再到案例分析，一步不落讲清楚！\n\n本周二线上（下午2：00-3：00）开课：\n✅双师教学，搭配合作教学效果1+1>2\n✅0基础教你搞定抖音开播\n✅ 到课且开播最高领取1000元本地推\n\n#餐饮商家 #直播培训 #免费课程'
    }
  ];

  const personas = [
    { id: 'professional', name: '专业顾问', icon: '👔' },
    { id: 'friendly', name: '亲切伙伴', icon: '😊' },
    { id: 'expert', name: '行业专家', icon: '🎯' },
    { id: 'cheerful', name: '活力满满', icon: '✨' }
  ];

  const contentTypes = [
    { id: 'official', name: '官方发布', icon: '📢' },
    { id: 'tip', name: '经营技巧', icon: '💡' },
    { id: 'success', name: '成功案例', icon: '🏆' }
  ];

  const message = {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: 'blue',
        title: {
          content: '📱 朋友圈发布提醒',
          tag: 'plain_text'
        }
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**⏰ 提醒时间到啦！**\n\n您设置的是 ${freqLabel[subscription.frequency]} 发布一次朋友圈。\n\n今天为您准备了精选素材，赶紧看看吧！`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'hr'
        },
        {
          tag: 'div',
          text: {
            content: `**🔥 今日官方推荐**\n\n📢 ${officialContents[0].title}\n\n${officialContents[0].desc}`,
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
        {
          tag: 'hr'
        },
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
        {
          tag: 'hr'
        },
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

  return new Promise((resolve, reject) => {
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
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(message));
    req.end();
  });
}

function checkAndSendReminders() {
  const subscriptions = loadSubscriptions();
  const now = new Date();
  
  console.log(`[${now.toLocaleString()}] 检查提醒任务...`);

  subscriptions.forEach((sub, index) => {
    if (!sub.lastReminder) {
      sub.nextReminder = calculateNextReminder(sub.frequency).toISOString();
    } else {
      const nextReminder = new Date(sub.nextReminder);
      
      if (now >= nextReminder && isWorkDay(now)) {
        console.log(`发送提醒给: ${sub.webhook.substring(0, 30)}...`);
        
        sendFeishuReminder(sub.webhook, sub)
          .then(() => {
            sub.lastReminder = now.toISOString();
            sub.nextReminder = calculateNextReminder(sub.frequency, now).toISOString();
            saveSubscriptions(subscriptions);
            console.log('提醒发送成功');
          })
          .catch((error) => {
            console.error('发送提醒失败:', error);
          });
      }
    }
  });

  saveSubscriptions(subscriptions);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'POST' && req.url === '/api/subscribe') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const subscription = JSON.parse(body);
        subscription.id = Date.now();
        subscription.lastReminder = null;
        subscription.nextReminder = calculateNextReminder(subscription.frequency).toISOString();
        
        const subscriptions = loadSubscriptions();
        subscriptions.push(subscription);
        saveSubscriptions(subscriptions);
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, subscription }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/api/subscriptions') {
    const subscriptions = loadSubscriptions();
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, subscriptions }));
  } else if (req.method === 'DELETE' && req.url.startsWith('/api/subscribe/')) {
    const id = parseInt(req.url.split('/').pop());
    let subscriptions = loadSubscriptions();
    subscriptions = subscriptions.filter(s => s.id !== id);
    saveSubscriptions(subscriptions);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`提醒服务已启动: http://localhost:${PORT}`);
  console.log('每分钟检查一次提醒任务...\n');
  
  checkAndSendReminders();
  setInterval(checkAndSendReminders, 60 * 1000);
});
