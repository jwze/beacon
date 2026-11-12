/**
 * 路由表
 *
 * 新增页面只需要三步：
 *   1. 在 src/views/ 下新建 <Name>View.vue
 *   2. 在 src/styles/layout/ 下加一份 <layout>.css（可选，用于 body 级背景/字体）
 *   3. 在下面的 routes 里追加一条记录（放在 not-found 之前）
 *
 * meta 约定：
 *   title   浏览器标题
 *   layout  对应 body.page-<layout>，以及 src/styles/layout/<layout>.css
 *   lang    <html lang> 的取值
 *   public  为 true 时跳过安全防护（如 relay 展示页）
 */

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: "Jvz's Space", layout: 'home', lang: 'zh-CN' },
  },
  {
    path: '/luhn',
    name: 'luhn',
    component: () => import('../views/LuhnView.vue'),
    meta: {
      title: 'LUHN Card Generator - 卢恩算法银行卡号生成器',
      layout: 'luhn',
      lang: 'zh-CN',
    },
  },
  {
    path: '/relay',
    name: 'relay',
    component: () => import('../views/RelayView.vue'),
    meta: { title: '115613.xyz | edge relay', layout: 'relay', lang: 'en', public: true },
  },

  // ---- 旧地址兼容（MPA 时代的 .html 路径）----
  { path: '/index.html', redirect: '/' },
  {
    path: '/luhn.html',
    redirect: (to) => ({ name: 'luhn', query: to.query, hash: to.hash }),
  },
  {
    path: '/relay.html',
    redirect: (to) => ({ name: 'relay', query: to.query, hash: to.hash }),
  },

  // ---- 兜底：必须放在最后，捕获所有未匹配路径 ----
  // FallbackView 内再区分：反代路径 → 诊断页；其余 → 原版 404 页
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/FallbackView.vue'),
    // meta 按原 public/404.html 还原：标题 Error Page、无 lang、无 viewport、无切换动画
    meta: {
      title: 'Error Page',
      layout: 'notfound',
      lang: null,
      viewport: null,
      transition: false,
    },
  },
];

export default routes;
