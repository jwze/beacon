/**
 * relay 页数据源
 * 出口 IP 与归属地的逐级降级查询，纯函数，便于单测与复用。
 */

export const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;

const LOCATION_MAX_LENGTH = 28;
const DEFAULT_TIMEOUT = 6000;

export function generateSessionId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { cache: 'no-store', signal: controller.signal, ...options });
  } finally {
    clearTimeout(timer);
  }
}

/** 依次尝试多个 IP 来源，返回第一个可用结果 */
export async function resolveIp() {
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
export async function resolveLocation(ip) {
  if (!ip || ip === '?' || ip.includes(':')) return null; // 跳过 IPv6

  try {
    const res = await fetchWithTimeout(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    if (data && !data.error && data.country_name) {
      const text = data.city ? `${data.city}, ${data.country_name}` : data.country_name;
      return text.length > LOCATION_MAX_LENGTH
        ? `${text.substring(0, LOCATION_MAX_LENGTH - 2)}..`
        : text;
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/** 直接用 IP 访问（而非域名）时给出提示 */
export function isIpHostname(hostname) {
  return IPV4_PATTERN.test(hostname);
}
