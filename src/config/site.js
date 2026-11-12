/**
 * 站点展示配置
 * 新增/调整首页入口时只改这里，无需改动页面结构。
 *
 * item 支持两种写法：
 *   { name, route }  站内页面，渲染为 <router-link>（route 为路由 name）
 *   { name, url }    站外或反代路径，渲染为 <a target="_blank">
 */
export const SITE_CONFIG = {
  title: "Jvz's Space",
  brand: 'beacon',
  copyright: '© 2025 Jvz All rights reserved.',
  nav: [
    { name: 'Gitea', url: '/gitea' },
    { name: 'Luhn', route: 'luhn' },
    { name: 'SpeedTest', url: '/speedtest' },
    { name: 'Probe', url: '/probe' },
  ],
};

export default SITE_CONFIG;
