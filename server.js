const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const axios = require('axios');
const { spawn } = require('child_process');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');
const PUBLIC_DEMO_URL_FILE = path.join(__dirname, 'public_demo_url.txt');
const LOCK_FILE = path.join(__dirname, 'server.lock.json');
const TIME_ZONE = process.env.TIME_ZONE || 'Asia/Shanghai';
const ANALYTICS_FILE = path.join(__dirname, 'public_analytics.json');
const DAILY_STATS_WEBHOOK = (process.env.DAILY_STATS_WEBHOOK || '').trim();
const DAILY_STATS_HM = (process.env.DAILY_STATS_HM || '19:05').trim();
const PUBLIC_HOST_SUFFIX = (process.env.PUBLIC_HOST_SUFFIX || 'trycloudflare.com').trim();
const FEISHU_APP_ID = (process.env.FEISHU_APP_ID || '').trim();
const FEISHU_APP_SECRET = (process.env.FEISHU_APP_SECRET || '').trim();
const FEISHU_CHAT_IDS = (process.env.FEISHU_CHAT_IDS || '').trim();
const REMINDER_HM = (process.env.REMINDER_HM || '12:00').trim();
const REFRESH_HM = (process.env.REFRESH_HM || '11:55').trim();
const EVENING_REMINDER_HM = (process.env.EVENING_REMINDER_HM || '19:00').trim();
const EVENING_REFRESH_HM = (process.env.EVENING_REFRESH_HM || '18:55').trim();
const ENABLE_WEBHOOK_SUBSCRIPTIONS = (process.env.ENABLE_WEBHOOK_SUBSCRIPTIONS || 'true').trim() === 'true';
const APPBOT_STATE_FILE = path.join(__dirname, 'appbot_state.json');

let managedTunnelProcess = null;
let managedTunnelUrl = '';
let lastTunnelRefreshDayNoon = '';
let lastTunnelRefreshDayEvening = '';
let lastDailyStatsSentDayKey = '';
let cachedTenantToken = '';
let cachedTenantTokenExpireAt = 0;
let lastAppBotReminderDayKey = '';

function loadAppBotState() {
  if (!fs.existsSync(APPBOT_STATE_FILE)) return;
  try {
    const j = JSON.parse(fs.readFileSync(APPBOT_STATE_FILE, 'utf8'));
    if (j && typeof j.lastAppBotReminderDayKey === 'string') {
      lastAppBotReminderDayKey = j.lastAppBotReminderDayKey;
    }
  } catch (e) {}
}

function saveAppBotState() {
  try {
    fs.writeFileSync(APPBOT_STATE_FILE, JSON.stringify({ lastAppBotReminderDayKey }, null, 2));
  } catch (e) {}
}

function tryAcquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const prev = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      if (prev && prev.pid) {
        try {
          process.kill(prev.pid, 0);
          throw new Error(`服务已在运行(pid=${prev.pid})，请先停止旧进程或更换端口`);
        } catch (e) {
          if (e && e.message && e.message.includes('服务已在运行')) throw e;
        }
      }
    } catch (e) {
      if (e && e.message && e.message.includes('服务已在运行')) throw e;
    }
  }
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, port: PORT, startedAt: new Date().toISOString() }, null, 2));
  const cleanup = () => {
    try {
      const cur = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      if (cur && cur.pid === process.pid) fs.unlinkSync(LOCK_FILE);
    } catch (e) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
}

function dateKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function getTzParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short'
  }).formatToParts(date);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    weekday: map.weekday
  };
}

function getTzHm(date) {
  const p = getTzParts(date);
  return `${p.hour}:${p.minute}`;
}

function getTzMinutes(date) {
  const p = getTzParts(date);
  return Number(p.hour) * 60 + Number(p.minute);
}

function isWorkDayTz(date) {
  const weekday = getTzParts(date).weekday;
  return weekday !== 'Sat' && weekday !== 'Sun';
}

function versionStamp(date) {
  const p = getTzParts(date);
  return `${p.year}${p.month}${p.day}${p.hour}${p.minute}`;
}

function buildDemoUrl(query = '') {
  let configured = '';
  try {
    configured = fs.readFileSync(PUBLIC_DEMO_URL_FILE, 'utf8').trim();
  } catch (e) {}
  const envUrl = (process.env.PUBLIC_DEMO_URL || '').trim();
  const base = (configured || envUrl).replace(/\/+$/, '') || `${PUBLIC_BASE_URL}/demo.html`;
  if (!query) return base;
  return `${base}${query.startsWith('?') ? query : `?${query}`}`;
}

function writePublicDemoUrl(url) {
  fs.writeFileSync(PUBLIC_DEMO_URL_FILE, url + '\n');
}

function stopManagedTunnel() {
  if (!managedTunnelProcess) return;
  try {
    managedTunnelProcess.kill('SIGTERM');
  } catch (e) {}
  managedTunnelProcess = null;
  managedTunnelUrl = '';
}

function startManagedTunnelOnce() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--config', '/dev/null', '--protocol', 'http2', '--url', `http://localhost:${PORT}`], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    managedTunnelProcess = child;
    let stdoutBuf = '';
    let stderrBuf = '';
    let settled = false;
    const matchUrl = (text) => {
      const m = String(text || '').match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
      return m && m[0] ? m[0].replace(/\/+$/, '') : '';
    };
    const tryResolve = (text) => {
      if (settled) return;
      const u = matchUrl(text);
      if (!u) return;
      settled = true;
      managedTunnelUrl = u;
      resolve(u);
    };
    const onStdout = (chunk) => {
      const s = chunk.toString();
      stdoutBuf += s;
      tryResolve(s);
      tryResolve(stdoutBuf);
    };
    const onStderr = (chunk) => {
      const s = chunk.toString();
      stderrBuf += s;
      tryResolve(s);
      tryResolve(stderrBuf);
    };
    child.stdout.on('data', onStdout);
    child.stderr.on('data', onStderr);
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill('SIGTERM');
      } catch (e) {}
      reject(new Error(`cloudflared 超时未返回公网地址 stdout=${stdoutBuf.slice(-200)} stderr=${stderrBuf.slice(-200)}`));
    }, 25000);
    child.on('exit', (code) => {
      clearTimeout(timer);
      if (managedTunnelProcess === child) {
        managedTunnelProcess = null;
      }
      if (!managedTunnelUrl && !settled) {
        settled = true;
        reject(new Error(`cloudflared 退出(code=${code}) stdout=${stdoutBuf.slice(-200)} stderr=${stderrBuf.slice(-200)}`));
      }
    });
    child.on('error', reject);
  });
}

async function refreshPublicLink(now, reason) {
  stopManagedTunnel();
  let lastError = null;
  for (let i = 0; i < 3; i++) {
    try {
      const base = await startManagedTunnelOnce();
      const url = `${base}/demo.html?v=${versionStamp(now)}`;
      writePublicDemoUrl(url);
      console.log(`🔗 更新公网链接(${reason}): ${url}`);
      return url;
    } catch (e) {
      lastError = e;
    }
  }
  console.error('生成公网链接失败:', lastError && lastError.message ? lastError.message : lastError);
  return '';
}

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const DATA_FILE = path.join(__dirname, 'subscriptions.json');

function loadAnalytics() {
  if (!fs.existsSync(ANALYTICS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function saveAnalytics(data) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

function ensureDayStats(store, dayKey) {
  if (!store[dayKey]) {
    store[dayKey] = {
      openCount: 0,
      copyCount: 0,
      copySuccessCount: 0,
      copyFailCount: 0,
      visitors: {},
      copiers: {},
      updatedAt: new Date().toISOString()
    };
  }
  return store[dayKey];
}

function summarizeDayStats(dayStats) {
  const visitors = dayStats && dayStats.visitors ? Object.keys(dayStats.visitors).length : 0;
  const copiers = dayStats && dayStats.copiers ? Object.keys(dayStats.copiers).length : 0;
  return {
    openUniqueUsers: visitors,
    openCount: Number(dayStats && dayStats.openCount ? dayStats.openCount : 0),
    copyUniqueUsers: copiers,
    copyCount: Number(dayStats && dayStats.copyCount ? dayStats.copyCount : 0),
    copySuccessCount: Number(dayStats && dayStats.copySuccessCount ? dayStats.copySuccessCount : 0),
    copyFailCount: Number(dayStats && dayStats.copyFailCount ? dayStats.copyFailCount : 0),
    updatedAt: dayStats && dayStats.updatedAt ? dayStats.updatedAt : null
  };
}

function isPublicRequest(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  if (!PUBLIC_HOST_SUFFIX) return false;
  if (host.includes(PUBLIC_HOST_SUFFIX.toLowerCase())) return true;
  return false;
}

function updateAnalytics(mutator) {
  const store = loadAnalytics();
  mutator(store);
  saveAnalytics(store);
}

function sanitizeVisitorId(id) {
  const s = String(id || '').trim();
  if (!s) return '';
  if (s.length > 120) return '';
  if (!/^[a-zA-Z0-9._:-]+$/.test(s)) return '';
  return s;
}

function buildDailyStatsMessage(dayKey, summary) {
  const openLine = `- 打开公网：${summary.openUniqueUsers} 人（${summary.openCount} 次）`;
  const copyLine = `- 复制文案：${summary.copyUniqueUsers} 人（${summary.copyCount} 次）`;
  const extra = summary.copySuccessCount + summary.copyFailCount > 0
    ? `\n- 复制成功/失败：${summary.copySuccessCount} / ${summary.copyFailCount}`
    : '';
  const content = `**日期**：${dayKey}\n\n${openLine}\n${copyLine}${extra}\n\n🔗 公网入口：${buildDemoUrl()}\n\n更新时间：${summary.updatedAt || ''}`;
  return {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        template: 'green',
        title: { content: '📊 公网数据日报', tag: 'plain_text' }
      },
      elements: [
        {
          tag: 'div',
          text: {
            tag: 'lark_md',
            content
          }
        }
      ]
    }
  };
}

async function sendDailyStats(now) {
  const dayKey = dateKey(now);
  const store = loadAnalytics();
  const dayStats = ensureDayStats(store, dayKey);
  const summary = summarizeDayStats(dayStats);
  const reportMd = `# 公网数据日报\n\n- 日期：${dayKey}\n- 打开公网：${summary.openUniqueUsers} 人（${summary.openCount} 次）\n- 复制文案：${summary.copyUniqueUsers} 人（${summary.copyCount} 次）\n- 复制成功/失败：${summary.copySuccessCount} / ${summary.copyFailCount}\n- 公网入口：${buildDemoUrl()}\n- 更新时间：${summary.updatedAt || ''}\n`;
  const reportFile = path.join(__dirname, `daily_public_stats_${dayKey}.md`);
  try {
    fs.writeFileSync(reportFile, reportMd);
  } catch (e) {}

  if (!DAILY_STATS_WEBHOOK) {
    console.log(`📊 公网数据日报(${dayKey})\n${reportMd}`);
    return false;
  }
  const message = buildDailyStatsMessage(dayKey, summary);
  const ok = await sendFeishuMessage(DAILY_STATS_WEBHOOK, message);
  if (ok) {
    console.log(`📊 已发送公网数据日报(${dayKey})`);
  }
  return ok;
}

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

async function getTenantAccessToken() {
  const now = Date.now();
  if (cachedTenantToken && cachedTenantTokenExpireAt && now < cachedTenantTokenExpireAt - 30 * 1000) {
    return cachedTenantToken;
  }
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) return '';
  const r = await axios.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal/',
    { app_id: FEISHU_APP_ID, app_secret: FEISHU_APP_SECRET },
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
  const data = r && r.data ? r.data : null;
  if (!data || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取tenant_access_token失败: ${JSON.stringify(data)}`);
  }
  cachedTenantToken = data.tenant_access_token;
  const expireIn = Number(data.expire || 0);
  cachedTenantTokenExpireAt = now + (expireIn > 0 ? expireIn * 1000 : 60 * 60 * 1000);
  return cachedTenantToken;
}

function buildReminderCardSimple() {
  return {
    config: { wide_screen_mode: true },
    header: {
      template: 'blue',
      title: { content: '📱 朋友圈发布提醒', tag: 'plain_text' }
    },
    elements: [
      {
        tag: 'div',
        text: {
          content: `**⏰ 提醒时间到啦！**\n\n您设置的是 每个工作日 发布一次朋友圈。\n\n🔗 工具入口：${buildDemoUrl()}\n\n今天为您准备了精选素材，赶紧看看吧！`,
          tag: 'lark_md'
        }
      }
    ]
  };
}

async function sendAppBotToChats(card) {
  const chatIds = FEISHU_CHAT_IDS.split(',').map(s => s.trim()).filter(Boolean);
  if (chatIds.length === 0) return false;
  const token = await getTenantAccessToken();
  if (!token) return false;
  let ok = true;
  for (const chatId of chatIds) {
    try {
      const resp = await axios.post(
        'https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id',
        { receive_id: chatId, msg_type: 'interactive', content: JSON.stringify(card) },
        { headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${token}` } }
      );
      const data = resp && resp.data ? resp.data : null;
      if (!data || data.code !== 0) {
        ok = false;
        console.error(`应用机器人发送失败(chat_id=${chatId}):`, JSON.stringify(data));
      }
    } catch (e) {
      ok = false;
      console.error(`应用机器人发送异常(chat_id=${chatId}):`, e && e.message ? e.message : e);
    }
  }
  return ok;
}

async function sendAppBotReminderIfNeeded(now) {
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET || !FEISHU_CHAT_IDS) return false;
  const today = dateKey(now);
  if (lastAppBotReminderDayKey === today) return false;
  if (!isWorkDayTz(now)) return false;
  const card = buildReminderCardSimple();
  const ok = await sendAppBotToChats(card);
  if (ok) {
    lastAppBotReminderDayKey = today;
    saveAppBotState();
    console.log(`✅ 已发送应用机器人提醒(${today})`);
    return true;
  }
  return false;
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
            content: `**⏰ 提醒时间到啦！**\n\n您设置的是 ${freqLabel[subscription.frequency] || '每个工作日'} 发布一次朋友圈。\n\n🔗 工具入口：${buildDemoUrl()}\n\n今天为您准备了精选素材，赶紧看看吧！`,
            tag: 'lark_md'
          }
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

function addWorkdays(startDate, workdays) {
  const d = new Date(startDate);
  let added = 0;
  while (added < workdays) {
    d.setDate(d.getDate() + 1);
    if (isWorkDayTz(d)) added += 1;
  }
  return d;
}

function getNextCycleDayKey(sub, now) {
  if (!sub.lastCycleDayKey) {
    return dateKey(now);
  }
  const base = new Date(`${sub.lastCycleDayKey}T00:00:00`);
  const next = addWorkdays(base, Number(sub.frequency || 1));
  return dateKey(next);
}

async function sendReminderIfNeeded({ sub, now, slot }) {
  const today = dateKey(now);
  const lastKey = slot === 'noon' ? (sub.lastReminderNoonDayKey || '') : (sub.lastReminderEveningDayKey || '');
  if (lastKey === today) return false;
  if (!isWorkDayTz(now)) return false;

  const nextCycle = getNextCycleDayKey(sub, now);
  if (today < nextCycle) return false;

  const message = buildReminderMessage(sub);
  const success = await sendFeishuMessage(sub.webhook, message);
  if (!success) return false;

  sub.lastReminder = now.toISOString();
  if (slot === 'noon') {
    sub.lastReminderNoonDayKey = today;
  } else {
    sub.lastReminderEveningDayKey = today;
    sub.lastCycleDayKey = today;
  }
  return true;
}

async function onTick() {
  const now = new Date();
  const hm = getTzHm(now);
  const minutes = getTzMinutes(now);
  const today = dateKey(now);
  if (hm === DAILY_STATS_HM && lastDailyStatsSentDayKey !== today) {
    lastDailyStatsSentDayKey = today;
    await sendDailyStats(now);
  }
  if (!isWorkDayTz(now)) return;

  const refreshMin = Number((REFRESH_HM.split(':')[0] || '11')) * 60 + Number((REFRESH_HM.split(':')[1] || '55'));
  const reminderMin = Number((REMINDER_HM.split(':')[0] || '12')) * 60 + Number((REMINDER_HM.split(':')[1] || '00'));
  const shouldRefreshNoon = minutes >= refreshMin && minutes < reminderMin;
  const shouldSendNoon = minutes >= reminderMin && minutes < reminderMin + 5;
  const eveningRefreshMin = Number((EVENING_REFRESH_HM.split(':')[0] || '18')) * 60 + Number((EVENING_REFRESH_HM.split(':')[1] || '55'));
  const eveningReminderMin = Number((EVENING_REMINDER_HM.split(':')[0] || '19')) * 60 + Number((EVENING_REMINDER_HM.split(':')[1] || '00'));
  const shouldRefreshEvening = minutes >= eveningRefreshMin && minutes < eveningReminderMin;
  const shouldSendEvening = minutes >= eveningReminderMin && minutes < eveningReminderMin + 5;

  if (shouldRefreshNoon && lastTunnelRefreshDayNoon !== today) {
    lastTunnelRefreshDayNoon = today;
    await refreshPublicLink(now, '12点前刷新');
  }

  if (shouldRefreshEvening && lastTunnelRefreshDayEvening !== today) {
    lastTunnelRefreshDayEvening = today;
    await refreshPublicLink(now, '19点前刷新');
  }

  const slot = shouldSendNoon ? 'noon' : shouldSendEvening ? 'evening' : '';
  if (!slot) return;

  if (slot === 'noon' && lastTunnelRefreshDayNoon !== today) {
    lastTunnelRefreshDayNoon = today;
    await refreshPublicLink(now, '12点前补刷新');
  }
  if (slot === 'evening' && lastTunnelRefreshDayEvening !== today) {
    lastTunnelRefreshDayEvening = today;
    await refreshPublicLink(now, '19点前补刷新');
  }

  if (!ENABLE_WEBHOOK_SUBSCRIPTIONS) return;
  const subscriptions = loadSubscriptions();
  let updated = false;
  for (const sub of subscriptions) {
    const sent = await sendReminderIfNeeded({ sub, now, slot });
    if (sent) updated = true;
  }
  if (updated) saveSubscriptions(subscriptions);
}

cron.schedule('* * * * *', () => {
  onTick().catch((e) => console.error('定时任务异常:', e && e.message ? e.message : e));
});

// 初始化订阅时设置下次提醒时间
app.post('/api/init-reminders', (req, res) => {
  res.json({ success: true, subscriptions: loadSubscriptions() });
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

app.post('/api/public/track', (req, res) => {
  const isPublic = isPublicRequest(req);
  const body = req.body || {};
  const event = String(body.event || '').trim();
  const visitorId = sanitizeVisitorId(body.visitorId);
  const ok = body.ok === true ? true : body.ok === false ? false : null;
  if (!isPublic) return res.json({ success: true, ignored: true });
  if (!visitorId) return res.json({ success: true, ignored: true });
  if (event !== 'open' && event !== 'copy') return res.json({ success: true, ignored: true });

  const now = new Date();
  const dayKey = dateKey(now);
  updateAnalytics((store) => {
    const dayStats = ensureDayStats(store, dayKey);
    dayStats.updatedAt = new Date().toISOString();
    if (event === 'open') {
      dayStats.openCount = Number(dayStats.openCount || 0) + 1;
      dayStats.visitors[visitorId] = 1;
      return;
    }
    if (event === 'copy') {
      dayStats.copyCount = Number(dayStats.copyCount || 0) + 1;
      dayStats.copiers[visitorId] = Number(dayStats.copiers[visitorId] || 0) + 1;
      if (ok === true) dayStats.copySuccessCount = Number(dayStats.copySuccessCount || 0) + 1;
      if (ok === false) dayStats.copyFailCount = Number(dayStats.copyFailCount || 0) + 1;
    }
  });

  res.json({ success: true });
});

app.get('/api/public/stats', (req, res) => {
  const date = String(req.query.date || '').trim();
  const dayKey = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dateKey(new Date());
  const store = loadAnalytics();
  const dayStats = ensureDayStats(store, dayKey);
  res.json({ dayKey, ...summarizeDayStats(dayStats) });
});

app.get('/api/public/demo-url', (req, res) => {
  res.json({ url: buildDemoUrl() });
});

app.post('/api/admin/refresh-demo-url', async (req, res) => {
  if (isPublicRequest(req)) {
    return res.status(403).json({ success: false, error: 'forbidden' });
  }
  try {
    const now = new Date();
    const url = await refreshPublicLink(now, '手动刷新');
    return res.json({ success: true, url });
  } catch (e) {
    return res.status(500).json({ success: false, error: e && e.message ? e.message : String(e) });
  }
});

tryAcquireLock();
loadAppBotState();

app.listen(PORT, () => {
  console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  console.log(`📱 前端页面: http://localhost:${PORT}/demo.html`);
  console.log(`📋 API 订阅: http://localhost:${PORT}/api/subscriptions`);
});
