/**
 * relay 展示页
 * 展示访问者出口 IP 与地理位置（Cloudflare trace → 第三方 IP 接口逐级降级）。
 */

const IP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const LOCATION_MAX_LENGTH = 28;

function generateSessionId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function fetchWithTimeout(url, options = {}, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { cache: 'no-store', signal: controller.signal, ...options });
  } finally {
    clearTimeout(timer);
  }
}

/** 依次尝试多个 IP 来源，返回第一个可用结果 */
async function resolveIp() {
  const sources = [
    // Cloudflare 边缘节点，同源部署时最快
    async () => {
      const res = await fetchWithTimeout(`${window.location.origin}/cdn-cgi/trace`);
      const text = await res.text();
      const match = text.match(/ip=([^\n]+)/);
      return match ? match[1] : null;
    },
    async () => (await fetchWithTimeout('https://api.ip.sb/ip')).text(),
    async () => (await fetchWithTimeout('https://api.my-ip.io/ip')).text(),
  ];

  for (const source of sources) {
    try {
      const ip = (await source())?.trim();
      if (ip) return ip;
    } catch {
      // 忽略该来源失败，继续降级
    }
  }
  return '?';
}

/** 反查 IP 归属地，失败时显示 Unknown */
async function resolveLocation(ip) {
  if (!ip || ip === '?' || ip.includes(':')) return null;

  try {
    const res = await fetchWithTimeout(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    if (data && !data.error && data.country_name) {
      const text = data.city ? `${data.city}, ${data.country_name}` : data.country_name;
      return text.length > LOCATION_MAX_LENGTH ? `${text.substring(0, LOCATION_MAX_LENGTH - 2)}..` : text;
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function startClock(el) {
  const tick = () => {
    el.innerText = new Date().toLocaleTimeString('en-GB', { hour12: false });
  };
  tick();
  setInterval(tick, 1000);
}

function initHints(elements, sessionId) {
  const { hint, footer } = elements;
  if (IP_PATTERN.test(window.location.hostname)) {
    if (hint) hint.innerHTML = `⚠️ USE DOMAIN · ${sessionId}`;
    if (footer) footer.innerHTML = '✧ NON-STANDARD ACCESS · USE 115613.xyz ✧';
  } else {
    if (hint) hint.innerHTML = `SECURE TUNNEL · TRUSTED · ${sessionId}`;
    if (footer) footer.innerHTML = '✦ TLS ENCRYPTED · ORIGIN CONCEALED ✦';
  }
}

function renderLocationSlot() {
  const holder = document.getElementById('dynamicMeta');
  if (!holder) return;
  holder.innerHTML = `
        <div class="info-item" id="locationItem" style="display: none;">
            <div class="info-stat" id="locationValue">--</div>
            <div class="info-caption">LOCATION</div>
        </div>
    `;
}

function updateLocationDisplay(text) {
  const item = document.getElementById('locationItem');
  const value = document.getElementById('locationValue');
  if (!item || !value) return;
  value.innerText = text;
  item.style.display = 'block';
}

async function bootstrap() {
  const ipEl = document.getElementById('mainIp');
  const clockEl = document.getElementById('liveClock');

  renderLocationSlot();
  initHints(
    { hint: document.getElementById('ipHint'), footer: document.getElementById('footerText') },
    generateSessionId(),
  );

  if (clockEl) startClock(clockEl);

  const ip = await resolveIp();
  if (ipEl) ipEl.innerText = ip;

  const location = await resolveLocation(ip);
  if (location) updateLocationDisplay(location);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
