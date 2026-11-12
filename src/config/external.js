/**
 * 反代路径配置（站外项目挂在本域名的哪些路径下）
 *
 * 这些路径由 nginx（或 Cloudflare Tunnel）转发给别的项目，不属于 SPA。
 * 新增一条后：
 *   1. npm run proxy:sync        重新生成 deploy/nginx/*.conf 与 public/_redirects
 *   2. nginx -t && nginx -s reload
 * 首页入口按钮会自动出现（见 config/site.js），前端路由也不会把它当成 404。
 *
 * 字段说明：
 *   prefix    对外路径前缀，必须与 nginx 的 location 一致
 *   label     首页按钮文案 / 诊断页显示名
 *   upstream  上游地址 host:port（仅用于生成 nginx upstream 块，按实际填写）
 */
export const EXTERNAL_PATHS = [
  { prefix: '/gitea', label: 'Gitea', upstream: '127.0.0.1:3000' },
  // 下面两条的 upstream 是占位端口，接实际服务时改成真实地址
  { prefix: '/speedtest', label: 'SpeedTest', upstream: '127.0.0.1:8081' },
  { prefix: '/probe', label: 'Probe', upstream: '127.0.0.1:8082' },
];

/**
 * 判断某个路径是否属于反代路径（按段匹配：/gitea 与 /gitea/xxx 命中，/giteax 不命中）
 * @param {string} path 以 / 开头的路径
 * @returns {(typeof EXTERNAL_PATHS)[number] | null}
 */
export function matchExternalPath(path) {
  if (!path || !path.startsWith('/')) return null;

  return (
    EXTERNAL_PATHS.find(
      (entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`),
    ) ?? null
  );
}

export default EXTERNAL_PATHS;
