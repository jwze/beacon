#!/usr/bin/env node
/**
 * 由 src/config/external.js 生成部署配置
 *
 * 产物：
 *   deploy/nginx/beacon-upstreams.conf   http 级：upstream + $connection_upgrade
 *   deploy/nginx/beacon-locations.conf   server 级：反代 location + SPA 回退
 *   public/_redirects                    Cloudflare Pages 回退（反代前缀不被通配吞掉）
 *
 * 用法：npm run proxy:sync（npm run build 前会自动执行）
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { EXTERNAL_PATHS } from '../src/config/external.js';

const target = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));
const BANNER = '⚠️ 本文件由 npm run proxy:sync 生成，来源 src/config/external.js，请勿手改。';

const upstreamName = (prefix) => `beacon_${prefix.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '_')}`;

/* ------------------------------ nginx：http 级 ------------------------------ */
function buildUpstreams() {
  const lines = [
    '# ' + BANNER,
    '# 用途：放在 nginx 的 http {} 块内（与其它 upstream / map 同级）。',
    '',
  ];

  if (EXTERNAL_PATHS.length === 0) {
    lines.push('# 当前没有配置反代路径');
  }

  EXTERNAL_PATHS.forEach((entry) => {
    lines.push(`upstream ${upstreamName(entry.prefix)} {`);
    lines.push(`    server ${entry.upstream};`);
    lines.push('    keepalive 16;');
    lines.push('}');
    lines.push('');
  });

  lines.push('# WebSocket 支持；若 http {} 里已有同名 map，删掉这段即可');
  lines.push('map $http_upgrade $connection_upgrade {');
  lines.push('    default upgrade;');
  lines.push("    ''      close;");
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/* ----------------------------- nginx：server 级 ----------------------------- */
function buildLocations() {
  const lines = [
    '# ' + BANNER,
    '# 用途：include 进站点的 server {} 内，位置必须在 SPA 回退之前。',
    '# 顺序说明：`location =` 精确匹配优先级最高，其次 `^~` 前缀匹配，最后才是 `location /`。',
    '',
  ];

  if (EXTERNAL_PATHS.length === 0) {
    lines.push('# 当前没有配置反代路径');
    lines.push('');
  }

  EXTERNAL_PATHS.forEach((entry) => {
    const name = upstreamName(entry.prefix);

    lines.push(`# ${entry.label} → ${entry.upstream}`);
    lines.push(`location = ${entry.prefix} {`);
    lines.push(`    return 301 ${entry.prefix}/;`);
    lines.push('}');
    lines.push('');
    lines.push(`location ^~ ${entry.prefix}/ {`);
    // 保留前缀转发：上游服务需要知道自己挂在子路径下（Gitea 需设 ROOT_URL）
    lines.push(`    proxy_pass http://${name};`);
    lines.push('    proxy_http_version 1.1;');
    lines.push('    proxy_set_header Host $host;');
    lines.push('    proxy_set_header X-Real-IP $remote_addr;');
    lines.push('    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
    lines.push('    proxy_set_header X-Forwarded-Proto $scheme;');
    lines.push('    proxy_set_header Upgrade $http_upgrade;');
    lines.push('    proxy_set_header Connection $connection_upgrade;');
    lines.push('    proxy_read_timeout 300s;');
    lines.push('    client_max_body_size 100m;');
    lines.push('}');
    lines.push('');
    lines.push(`# 若上游服务只能跑在根路径，把上面一行改成 proxy_pass http://${name}/;（带斜杠会剥掉前缀）`);
    lines.push('');
  });

  lines.push('# SPA 静态资源：命中不到就真 404，别回退成 HTML');
  lines.push('location /assets/ {');
  lines.push('    try_files $uri =404;');
  lines.push('    expires 1y;');
  lines.push('    add_header Cache-Control "public, immutable";');
  lines.push('}');
  lines.push('');
  lines.push('# SPA 回退：其余路径（含前端路由 /luhn、/relay、未知路径）都交给 index.html');
  lines.push('location / {');
  lines.push('    try_files $uri $uri/ /index.html;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/* --------------------------- Cloudflare Pages 回退 --------------------------- */
function buildRedirects() {
  const lines = ['# ' + BANNER, ''];

  EXTERNAL_PATHS.forEach((entry) => {
    lines.push(`# 反代路径 ${entry.prefix}：由 Cloudflare 边缘（Tunnel / Origin Rules）接管`);
    lines.push(`${entry.prefix}      /404.html  404`);
    lines.push(`${entry.prefix}/*    /404.html  404`);
  });

  if (EXTERNAL_PATHS.length > 0) lines.push('');

  lines.push('# 缺失的静态资源不回退成 HTML');
  lines.push('/assets/*  /404.html  404');
  lines.push('');
  lines.push('# 其余请求交给 SPA（前端路由渲染页面 / 404）');
  lines.push('/*  /index.html  200');
  lines.push('');

  return lines.join('\n');
}

const outputs = [
  ['deploy/nginx/beacon-upstreams.conf', buildUpstreams()],
  ['deploy/nginx/beacon-locations.conf', buildLocations()],
  ['public/_redirects', buildRedirects()],
];

outputs.forEach(([path, content]) => {
  const file = target(path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
  console.log(`✓ ${path}`);
});

console.log(`\n已按 ${EXTERNAL_PATHS.length} 条反代路径生成配置：`);
EXTERNAL_PATHS.forEach((entry) => {
  console.log(`  ${entry.prefix.padEnd(14)} → ${entry.upstream}`);
});
console.log('\n下一步：nginx -t && nginx -s reload');
