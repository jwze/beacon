/**
 * 站点展示配置
 * 新增/调整首页入口时只改这里，无需改动页面结构。
 *
 * 反代路径的按钮由 config/external.js 自动生成（label → 文案，prefix → 链接），
 * 这里只决定顺序；没写进 NAV_ORDER 的反代路径会自动追加到末尾。
 *
 * item 两种写法：
 *   { name, route }  站内页面，渲染为 <router-link>
 *   { name, url }    站外/反代路径，渲染为 <a target="_blank">
 */
import { EXTERNAL_PATHS } from './external.js';

/** 站内页面入口，key 为路由 name */
const INTERNAL_NAV = {
  luhn: { name: 'Luhn', route: 'luhn' },
};

/** 按钮顺序：以 / 开头的是反代前缀，其余是 INTERNAL_NAV 的 key */
const NAV_ORDER = ['/gitea', 'luhn', '/speedtest', '/probe'];

function buildNav() {
  const items = [];

  NAV_ORDER.forEach((key) => {
    if (key.startsWith('/')) {
      const entry = EXTERNAL_PATHS.find((item) => item.prefix === key);
      if (entry) items.push({ name: entry.label, url: entry.prefix });
      return;
    }

    const internal = INTERNAL_NAV[key];
    if (internal) items.push(internal);
  });

  // 新增的反代路径即使还没排进 NAV_ORDER，也先出现在首页
  EXTERNAL_PATHS.forEach((entry) => {
    if (!NAV_ORDER.includes(entry.prefix)) {
      items.push({ name: entry.label, url: entry.prefix });
    }
  });

  return items;
}

export const SITE_CONFIG = {
  title: "Jvz's Space",
  brand: 'beacon',
  copyright: '© 2025 Jvz All rights reserved.',
  nav: buildNav(),
};

export default SITE_CONFIG;
