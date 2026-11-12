<script setup>
/**
 * 反代未就绪诊断页
 *
 * 触发条件：请求的路径在 config/external.js 里声明为反代路径，
 * 但服务端（nginx）没有对应的 location，于是回退到了 index.html。
 * 这属于部署配置问题，不是「页面不存在」，所以不能显示 404。
 */
import { computed, onMounted } from 'vue';

const props = defineProps({
  entry: { type: Object, required: true },
  path: { type: String, default: '/' },
});

const upstream = computed(() => props.entry.upstream ?? '未配置');

onMounted(() => {
  document.title = `反代未就绪 · ${props.entry.prefix}`;
});
</script>

<template>
  <div class="page-proxy">
    <div class="panel">
      <div class="kicker">PROXY NOT READY</div>
      <div class="code">502</div>
      <div class="title">{{ entry.label }} 已配置为反代路径，但服务端没有接管</div>

      <p class="desc">
        请求 <code>{{ path }}</code> 打到了前端入口（index.html），说明 nginx 里缺少
        <code>location {{ entry.prefix }}/</code>，或者改了配置还没 reload。
      </p>

      <dl class="meta">
        <div><dt>对外路径</dt><dd>{{ entry.prefix }}</dd></div>
        <div><dt>上游地址</dt><dd>{{ upstream }}</dd></div>
      </dl>

      <div class="actions">
        <a class="primary" href="/">回首页</a>
        <button type="button" @click="$router.replace(path)">重试</button>
      </div>

      <p class="footnote">
        已在 <code>src/config/external.js</code> 声明？执行 <code>npm run proxy:sync</code>
        生成配置，再 <code>nginx -t && nginx -s reload</code>。
      </p>
    </div>
  </div>
</template>

<style scoped src="../styles/view/proxy-pending.css"></style>
