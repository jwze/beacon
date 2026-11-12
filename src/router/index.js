/**
 * 路由实例与全局钩子
 *
 * 每个导航完成后统一处理：浏览器标题、<html lang>、body 布局类、安全防护检查。
 * 404 由 routes.js 里的 `/:pathMatch(.*)*` 兜底，静态托管侧的回退见 public/_redirects。
 */
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { SITE_CONFIG } from '@/config/site';
import { createGuard } from '@/security/guard';

/** body 布局类：body.page-<layout>，与 styles/layout/<layout>.css 一一对应 */
const LAYOUT_CLASS_PREFIX = 'page-';
let currentLayout = '';

function applyLayout(layout = '') {
  if (currentLayout === layout) return;

  if (currentLayout) document.body.classList.remove(`${LAYOUT_CLASS_PREFIX}${currentLayout}`);
  if (layout) document.body.classList.add(`${LAYOUT_CLASS_PREFIX}${layout}`);
  currentLayout = layout;
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

router.afterEach((to) => {
  document.title = to.meta.title ?? SITE_CONFIG.title;
  document.documentElement.lang = to.meta.lang ?? 'zh-CN';
  applyLayout(to.meta.layout ?? '');
  guard.check();
});

// 页面级监听（连点检测、冷却轮询）只装一次
guard.start();

export default router;
