<script setup>
/**
 * 未匹配路径的统一出口
 *
 * - 属于反代路径（config/external.js）→ 渲染诊断页，绝不显示 404
 * - 其余 → 原版 404 页（NotFoundView）
 *
 * 正常情况下反代路径的请求根本到不了这里（nginx 的 location 会先接管），
 * 只有服务端漏配时才会落到这个分支。
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { matchExternalPath } from '@/config/external';
import NotFoundView from './NotFoundView.vue';
import ProxyPendingView from './ProxyPendingView.vue';

const route = useRoute();
const external = computed(() => matchExternalPath(route.path));
</script>

<template>
  <ProxyPendingView v-if="external" :entry="external" :path="route.fullPath" />
  <NotFoundView v-else />
</template>
