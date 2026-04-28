const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const PORT = 3000;
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const DATA_FILE = path.join(__dirname, 'subscriptions.json');

// 读取订阅数据
function loadSubscriptions() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  return [];
}

// 保存订阅数据
function saveSubscriptions(subscriptions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(subscriptions, null, 2));
}

// 发送飞书消息
async function sendFeishuMessage(webhook, content) {
  try {
    await axios.post(webhook, content, {
      headers: { 'Content-Type': 'application/json' }
    });
    return true;
  } catch (error) {
    console.error('发送消息失败:', error.message);
    return false;
  }
}

// 构建提醒消息
function buildReminderMessage(subscription) {
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
      desc: '抖音生活服务最新商家入门直播课名额告急'
    },
    {
      id: 'official-2',
      title: '🍜 餐饮商家免费直播入门课',
      desc: '周二下午2点餐饮商家专属免费直播课'
    }
  ];

  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        template: 'blue',
        title: { content: '📱 朋友圈发布提醒', tag: 'plain_text' }
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**⏰ 提醒时间到啦！**\n\n您设置的是 ${freqLabel[subscription.frequency] || '每个工作日'} 发布一次朋友圈。\n\n今天为您准备了精选素材，赶紧看看吧！`,
            tag: 'lark_md'
          }
        },
        { tag: 'hr' },
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
        { tag: 'hr' },
        {
          tag: 'div',
          text: { content: '**👤 选择人设和内容类型', tag: 'plain_text' }
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
          text: { content: '**💡 其他选择', tag: 'plain_text' }
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
}

// API: 创建订阅
app.post('/api/subscribe', (req, res) => {
  const subscriptions = loadSubscriptions();
  const newSubscription = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    lastReminder: null,
    nextReminder: null
  };
  subscriptions.push(newSubscription);
  saveSubscriptions(subscriptions);
  res.json({ success: true, subscription: newSubscription });
});

// API: 获取所有订阅
app.get('/api/subscriptions', (req, res) => {
  res.json(loadSubscriptions());
});

// API: 删除订阅
app.delete('/api/subscribe/:id', (req, res) => {
  let subscriptions = loadSubscriptions();
  subscriptions = subscriptions.filter(s => s.id !== req.params.id);
  saveSubscriptions(subscriptions);
  res.json({ success: true });
});

// 计算下一次提醒时间
function calculateNextReminder(frequencyDays, lastReminder) {
  const now = new Date();
  let nextDate = lastReminder ? new Date(lastReminder) : new Date();
  
  let workDaysAdded = 0;
  while (workDaysAdded < frequencyDays) {
    nextDate.setDate(nextDate.getDate() + 1);
    const dayOfWeek = nextDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDaysAdded++;
    }
  }
  
  // 设置提醒时间为上午10点
  nextDate.setHours(12, 0, 0, 0);
  
  return nextDate;
}

// 定时检查并发送提醒（每分钟执行一次
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const subscriptions = loadSubscriptions();
  let updated = false;

  for (const sub of subscriptions) {
    const nextReminder = sub.nextReminder 
      ? new Date(sub.nextReminder) 
      : calculateNextReminder(sub.frequency, sub.lastReminder);
    
    // 如果到了提醒时间
    if (now >= nextReminder) {
      console.log(`发送提醒给: ${sub.id}`);
      
      const message = buildReminderMessage(sub);
      const success = await sendFeishuMessage(sub.webhook, message);
      
      if (success) {
        sub.lastReminder = now.toISOString();
        sub.nextReminder = calculateNextReminder(sub.frequency, now).toISOString();
        updated = true;
      }
    } else if (!sub.nextReminder) {
      sub.nextReminder = nextReminder.toISOString();
      updated = true;
    }
  }

  if (updated) {
    saveSubscriptions(subscriptions);
  }
});

// 初始化订阅时设置下次提醒时间
app.post('/api/init-reminders', (req, res) => {
  const subscriptions = loadSubscriptions();
  let updated = false;

  for (const sub of subscriptions) {
    if (!sub.nextReminder) {
      sub.nextReminder = calculateNextReminder(sub.frequency, sub.lastReminder).toISOString();
      updated = true;
    }
  }

  if (updated) {
    saveSubscriptions(subscriptions);
  }

  res.json({ success: true, subscriptions });
});

// 测试发送提醒
app.post('/api/test-reminder/:id', async (req, res) => {
  const subscriptions = loadSubscriptions();
  const subscription = subscriptions.find(s => s.id === req.params.id);
  
  if (!subscription) {
    return res.status(404).json({ success: false, error: '订阅不存在' });
  }

  const message = buildReminderMessage(subscription);
  const success = await sendFeishuMessage(subscription.webhook, message);
  
  res.json({ success });
});

app.listen(PORT, () => {
  console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  console.log(`📱 前端页面: http://localhost:${PORT}/demo.html`);
  console.log(`📋 API 订阅: http://localhost:${PORT}/api/subscriptions`);
});
