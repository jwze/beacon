<script setup>
/**
 * 404 兜底页 —— 与原 public/404.html 保持一致
 *
 * 结构、文案、内联样式、动画都照搬原页面；原页面的 `<meta http-equiv="refresh" content="5;url=/">`
 * 换成 5 秒后 router.replace('/')，视觉与跳转时长不变。
 * 原页面靠 /assets/notfound.js 启动安全防护，SPA 里防护已由 router 全局接管，无需重复挂载。
 */
import { onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import '@/styles/view/notfound.css';

// 与原来的 meta refresh 一致
const REDIRECT_DELAY = 5000;

const router = useRouter();
let timer = null;

onMounted(() => {
  timer = setTimeout(() => router.replace('/'), REDIRECT_DELAY);
});

onBeforeUnmount(() => {
  clearTimeout(timer);
});
</script>

<template>
  <div class="page-notfound">
    <div id="t-ov">
      <div class="motime">
        <div id="head-body"></div>
        <div id="head-topcover"></div>
        <div id="head-toplogo-bg"></div>
        <div id="head-toplogo"></div>
        <div id="head-toplogo-2"></div>
        <div id="head-bottom"></div>
        <div id="head-bottom-2"></div>
        <div id="head-sw"></div>
        <div id="head-sw-2"></div>
        <div id="head-eye"></div>
        <div id="head-eye-2"></div>
      </div>
    </div>

    <iframe frameborder="0" scrolling="no" src="" width="100%" height="100px"></iframe>

    <h1 style="text-align: center">
      <span style="color: #555; font-family: 'Microsoft YaHei'">jvze@pm.me</span>
    </h1>
    <blockquote>
      <p style="text-align: center">
        <span style="font-size: 14pt; font-family: 'comic sans ms', sans-serif">
          <span style="color: #555; font-family: 'Microsoft YaHei'">正在为您跳转&nbsp;</span>
          <!-- 原页面两个 span 之间的换行会渲染成一个空格；Vue 编译会丢掉纯空白节点，这里用插值显式补回 -->
          {{ ' ' }}
          <span style="color: #555540">Jvz's Space</span>
        </span>
      </p>
    </blockquote>
  </div>
</template>
