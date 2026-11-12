/**
 * 安全防护
 * 检测异常流量（频率 / UA / 来源 / 连点）并重定向到 relay 展示页。
 * 仅在浏览器侧生效，属于「挡掉低级扫描器」的轻量防线，不能替代服务端防护。
 *
 * SPA 用法：createGuard() 拿到实例，由 router 的 afterEach 调用 check()，
 * 页面级监听只装一次（start() / stop()）。
 */
import { SECURITY_CONFIG } from './config.js';

const now = () => Date.now();

/**
 * @param {typeof SECURITY_CONFIG} [config] 覆盖默认配置
 * @returns {{ start: () => void, stop: () => void, check: () => void }}
 */
export function createGuard(config = SECURITY_CONFIG) {
  const storage = window.localStorage;
  let started = false;
  let pollTimer = null;

  const onDocumentClick = () => {
    if (trackClick()) redirectToRelay();
  };

  const onPoll = () => {
    if (isInCooldown()) redirectToRelay();
  };

  const isWhitelisted = (path = window.location.pathname) =>
    config.whitelistPaths.some(
      (whitePath) => path === whitePath || path.startsWith(`${whitePath.replace(/\/$/, '')}/`),
    );

  const isInCooldown = () => {
    const blockedUntil = storage.getItem(config.storageKeys.blockedUntil);
    if (!blockedUntil) return false;

    if (now() < parseInt(blockedUntil, 10)) return true;

    // 冷却期结束，清除标记
    storage.removeItem(config.storageKeys.blockedUntil);
    storage.removeItem(config.storageKeys.requestCount);
    return false;
  };

  const setCooldown = () => {
    storage.setItem(config.storageKeys.blockedUntil, (now() + config.cooldownTime).toString());
    console.warn('[Guard] Suspicious activity detected. Redirecting to relay page.');
  };

  const redirectToRelay = () => {
    setCooldown();
    window.location.href = config.redirectUrl;
  };

  /** 每分钟请求数检测 */
  const checkRateLimit = () => {
    if (!config.enableRateLimit) return false;

    const timestamp = now();
    const requestCount = storage.getItem(config.storageKeys.requestCount);
    const lastRequestTime = storage.getItem(config.storageKeys.lastRequestTime);

    if (!requestCount || !lastRequestTime) {
      storage.setItem(config.storageKeys.requestCount, '1');
      storage.setItem(config.storageKeys.lastRequestTime, timestamp.toString());
      return false;
    }

    const count = parseInt(requestCount, 10);
    const lastTime = parseInt(lastRequestTime, 10);

    if (timestamp - lastTime < 60000) {
      if (count >= config.maxRequestsPerMinute) {
        console.warn(`[Guard] Rate limit exceeded: ${count} requests per minute`);
        return true;
      }
      storage.setItem(config.storageKeys.requestCount, (count + 1).toString());
    } else {
      storage.setItem(config.storageKeys.requestCount, '1');
    }

    storage.setItem(config.storageKeys.lastRequestTime, timestamp.toString());
    return false;
  };

  /** 可疑 User-Agent 检测 */
  const checkUserAgent = () => {
    if (!config.enableBehaviorCheck) return false;

    const userAgent = navigator.userAgent.toLowerCase();
    const suspicious = config.suspiciousUserAgents.some((keyword) => userAgent.includes(keyword));

    if (suspicious) console.warn('[Guard] Suspicious User-Agent detected:', userAgent);
    return suspicious;
  };

  /** 可疑来源检测 */
  const checkReferrer = () => {
    if (!config.enableReferrerCheck) return false;

    const referrer = document.referrer;
    if (!referrer) return false;

    const suspicious = config.suspiciousReferrers.some((pattern) => pattern.test(referrer));
    if (suspicious) console.warn('[Guard] Suspicious Referrer detected:', referrer);
    return suspicious;
  };

  /** 连点检测：超过阈值返回 true */
  const trackClick = () => {
    if (!config.enableBehaviorCheck) return false;

    const timestamp = now();
    let clickHistory = [];

    try {
      const stored = storage.getItem(config.storageKeys.clickHistory);
      if (stored) clickHistory = JSON.parse(stored);
    } catch {
      clickHistory = [];
    }

    // 只保留最近 5 秒的点击记录
    clickHistory = clickHistory.filter((time) => timestamp - time < 5000);
    clickHistory.push(timestamp);
    storage.setItem(config.storageKeys.clickHistory, JSON.stringify(clickHistory));

    if (clickHistory.length > config.maxClicksPerSecond * 5) {
      console.warn('[Guard] Abnormal click frequency detected:', clickHistory.length);
      return true;
    }
    return false;
  };

  /** 每次导航后调用一次 */
  function check() {
    if (isWhitelisted()) return;

    if (isInCooldown()) {
      redirectToRelay();
      return;
    }

    const threats = [];
    if (checkRateLimit()) threats.push('rate_limit');
    if (checkUserAgent()) threats.push('user_agent');
    if (checkReferrer()) threats.push('referrer');

    if (threats.length > 0) {
      console.warn('[Guard] Threats detected:', threats);
      redirectToRelay();
    }
  }

  function start() {
    if (started) return;
    started = true;

    document.addEventListener('click', onDocumentClick);
    pollTimer = window.setInterval(onPoll, 30000);

    console.info('[Guard] Security guard initialized');
  }

  function stop() {
    if (!started) return;
    started = false;

    document.removeEventListener('click', onDocumentClick);
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = null;
  }

  return { start, stop, check };
}

/**
 * 兼容一次性初始化（非 SPA 场景）：直接启动并立即检查一次。
 * @param {typeof SECURITY_CONFIG} [config]
 */
export function initSecurityGuard(config = SECURITY_CONFIG) {
  const guard = createGuard(config);
  const run = () => {
    guard.start();
    guard.check();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  return guard;
}

export default initSecurityGuard;
