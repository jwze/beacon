/**
 * 站点展示配置
 * 新增/调整首页入口按钮时只改这里，无需改动页面结构。
 */
export const SITE_CONFIG = {
  title: "Jvz's Space",
  brand: 'beacon',
  buttons: [
    { name: 'Gitea', url: '/gitea' },
    { name: 'Luhn', url: '/luhn.html' },
    { name: 'SpeedTest', url: '/speedtest' },
    { name: 'Probe', url: '/probe' },
  ],
};

export default SITE_CONFIG;
