/**
 * 路由实例与全局钩子
 *
 * 每个导航完成后统一处理页面外壳：浏览器标题、<html lang>、viewport、body 布局类、安全防护检查。
 * 未匹配路径由 routes.js 末尾的 `/:pathMatch(.*)*` 兜底，静态托管侧的回退见 public/_redirects。
 * 反代路径（config/external.js）在 beforeEach 里就被拦下，不会进入 404 分支。
 */
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { SITE_CONFIG } from '@/config/site';
import { matchExternalPath } from '@/config/external';
import { shouldAttemptProxyHop } from '@/lib/proxy-hop';
import { createGuard } from '@/security/guard';

const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1.0, viewport-fit=cover';

/** body 布局类：body.page-<layout>，与 styles/layout/<layout>.css 一一对应 */
const LAYOUT_CLASS_PREFIX = 'page-';
let currentLayout = '';

function applyLayout(layout = '') {
  if (currentLayout === layout) return;

  if (currentLayout) document.body.classList.remove(`${LAYOUT_CLASS_PREFIX}${currentLayout}`);
  if (layout) document.body.classList.add(`${LAYOUT_CLASS_PREFIX}${layout}`);
  currentLayout = layout;
}

/** lang 传 null 表示「和原页面一样，不带 lang 属性」 */
function applyLang(lang) {
  if (lang) {
    document.documentElement.lang = lang;
  } else {
    document.documentElement.removeAttribute('lang');
  }
}

/** viewport 传 null 表示「和原页面一样，没有 viewport meta」 */
function applyViewport(content) {
  const existing = document.head.querySelector('meta[name="viewport"]');

  if (content === null) {
    existing?.remove();
    return;
  }

  if (existing) {
    existing.content = content ?? DEFAULT_VIEWPORT;
    return;
  }

  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = content ?? DEFAULT_VIEWPORT;
  document.head.appendChild(meta);
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    return { top: 0 };
  },
});

const guard = createGuard();

router.beforeEach((to) => {
  // 反代路径不归 SPA 管：整页跳一次，让 nginx 接管
  if (!matchExternalPath(to.path)) return true;

  if (shouldAttemptProxyHop(to.fullPath)) {
    window.location.replace(to.fullPath);
    return false;
  }

  // 刚跳过又被打回 = 服务端没接管，交给 FallbackView 出诊断页（不会显示 404）
  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ?? SITE_CONFIG.title;
  // 注意区分「没写」（用默认 zh-CN）和「显式 null」（原页面就没有该属性）
  applyLang(to.meta.lang === undefined ? 'zh-CN' : to.meta.lang);
  applyViewport(to.meta.viewport === undefined ? DEFAULT_VIEWPORT : to.meta.viewport);
  applyLayout(to.meta.layout ?? '');
  guard.check();
});

// 页面级监听（连点检测、冷却轮询）只装一次
guard.start();

export default router;
