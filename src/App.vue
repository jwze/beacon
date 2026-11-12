<script setup>
/**
 * 应用外壳：只负责路由出口与切换过渡。
 * 页面级逻辑（标题、body 布局类、安全防护）都在 router/index.js 的全局钩子里完成。
 */
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <transition name="page-fade" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>
