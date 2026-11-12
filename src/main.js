/**
 * 应用入口
 * 单页面应用（SPA）：一个 index.html + vue-router，页面按路由懒加载。
 */
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// 全局基线 + 各布局层的 body 级样式（按 body.page-* 门控，互不干扰）
import './styles/base.css';
import './styles/layout/home.css';
import './styles/layout/luhn.css';
import './styles/layout/relay.css';
import './styles/layout/notfound.css';

createApp(App).use(router).mount('#app');
