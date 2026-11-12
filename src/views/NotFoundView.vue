<script setup>
/**
 * 404 兜底页
 * 由路由 `/:pathMatch(.*)*` 命中，覆盖所有未匹配路径（含任意深度的子路径）。
 * 5 秒后自动回首页，可手动取消；同时提供「返回上一页」。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const REDIRECT_SECONDS = 5;

const route = useRoute();
const router = useRouter();

const countdown = ref(REDIRECT_SECONDS);
const autoRedirect = ref(true);

let timer = null;

const requestedPath = computed(() => route.fullPath);

function stopCountdown() {
  autoRedirect.value = false;
  clearInterval(timer);
  timer = null;
}

function goHome() {
  stopCountdown();
  router.replace('/');
}

function goBack() {
  stopCountdown();

  // 直接打开该地址时没有可回退的历史，退化为首页
  if (window.history.state?.back) {
    router.back();
  } else {
    router.replace('/');
  }
}

onMounted(() => {
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) goHome();
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timer);
});
</script>

<template>
  <div class="page-notfound">
    <div class="panel">
      <div class="kicker">EDGE · ROUTE NOT FOUND</div>
      <div class="code">404</div>
      <div class="title">这条路径上没有灯</div>

      <p class="desc">
        请求的页面不存在，或者已经搬走了。<br />
        检查一下地址拼写，或者从首页重新出发。
      </p>

      <code class="path">{{ requestedPath }}</code>

      <div class="actions">
        <a class="primary" href="/" @click.prevent="goHome">返回首页</a>
        <button type="button" @click="goBack">返回上一页</button>
      </div>

      <div class="footnote" v-if="autoRedirect">
        <strong>{{ countdown }}</strong> 秒后自动返回首页 ·
        <a href="#" @click.prevent="stopCountdown">取消跳转</a>
      </div>
      <div class="footnote" v-else>已取消自动跳转</div>
    </div>
  </div>
</template>

<style scoped src="../styles/view/notfound.css"></style>
