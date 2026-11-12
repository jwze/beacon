/**
 * 反代路径的「只跳一次」保护
 *
 * 反代路径本不该由 SPA 渲染：请求应该先被 nginx 的 location 吞掉。
 * 万一服务端漏配，浏览器就会拿到 index.html，前端再把地址整页跳一次 —— 服务端还是回 index.html，
 * 于是形成无限重载。这里用 sessionStorage 记一个短窗口的足迹，第二次进来就不再跳，
 * 交给 FallbackView 渲染诊断页，明确告诉使用者「nginx 没接管这个前缀」。
 */

const HOP_KEY = 'beacon:proxy-hop';
const HOP_WINDOW = 3000;

/**
 * @param {string} path 完整路径（含 query/hash）
 * @returns {boolean} true = 可以整页跳一次；false = 刚刚跳过又被打回，别再跳
 */
export function shouldAttemptProxyHop(path) {
  const now = Date.now();

  let previous = null;
  try {
    previous = JSON.parse(window.sessionStorage.getItem(HOP_KEY) ?? 'null');
  } catch {
    previous = null;
  }

  const bouncedBack =
    previous && previous.path === path && now - previous.at < HOP_WINDOW;

  try {
    window.sessionStorage.setItem(HOP_KEY, JSON.stringify({ path, at: now }));
  } catch {
    // 隐私模式下 sessionStorage 不可写，退化为每次都尝试
  }

  return !bouncedBack;
}

export default shouldAttemptProxyHop;
