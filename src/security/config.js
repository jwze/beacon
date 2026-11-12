/**
 * 安全防护配置
 * 用于检测异常流量并重定向到防攻击展示页（relay）。
 */
export const SECURITY_CONFIG = Object.freeze({
  // 频率限制配置
  maxRequestsPerMinute: 60, // 每分钟最大请求数
  maxRequestsPerHour: 300, // 每小时最大请求数
  maxClicksPerSecond: 10, // 每秒最大点击数

  // 重定向配置
  redirectUrl: '/relay.html', // 防攻击展示页地址
  cooldownTime: 300000, // 冷却时间（5 分钟，单位毫秒）

  // 检测开关
  enableRateLimit: true, // 启用频率限制
  enableBehaviorCheck: true, // 启用行为检测
  enableReferrerCheck: true, // 启用来源检测

  // 可疑来源列表（正则表达式）
  suspiciousReferrers: [/bot/i, /crawler/i, /spider/i, /hack/i, /attack/i],

  // 可疑 User-Agent 关键词
  suspiciousUserAgents: ['bot', 'crawler', 'spider', 'hack', 'attack', 'ddos', 'flood'],

  // 白名单（不检测的路径）
  whitelistPaths: ['/relay.html', '/security.js', '/guard.js'],

  // 存储键名
  storageKeys: {
    requestCount: 'security_request_count',
    lastRequestTime: 'security_last_request',
    blockedUntil: 'security_blocked_until',
    clickHistory: 'security_click_history',
  },
});

export default SECURITY_CONFIG;
