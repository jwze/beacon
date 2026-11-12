<script setup>
/**
 * relay 展示页
 * 展示访问者出口 IP 与地理位置（Cloudflare trace → 第三方 IP 接口逐级降级）。
 * 取数逻辑见 src/lib/relay.js，本组件只负责状态与渲染。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { generateSessionId, isIpHostname, resolveIp, resolveLocation } from '@/lib/relay';

const ip = ref('--');
const location = ref('');
const hasLocation = ref(false);
const clock = ref('--:--:--');
const usingIpHost = ref(false);

const sessionId = generateSessionId();
let clockTimer = null;

const ipHint = computed(() =>
  usingIpHost.value ? `⚠️ USE DOMAIN · ${sessionId}` : `SECURE TUNNEL · TRUSTED · ${sessionId}`,
);

const footerText = computed(() =>
  usingIpHost.value
    ? '✧ NON-STANDARD ACCESS · USE 115613.xyz ✧'
    : '✦ TLS ENCRYPTED · ORIGIN CONCEALED ✦',
);

function tick() {
  clock.value = new Date().toLocaleTimeString('en-GB', { hour12: false });
}

onMounted(async () => {
  usingIpHost.value = isIpHostname(window.location.hostname);

  tick();
  clockTimer = setInterval(tick, 1000);

  ip.value = await resolveIp();

  const where = await resolveLocation(ip.value);
  if (where) {
    location.value = where;
    hasLocation.value = true;
  }
});

onBeforeUnmount(() => {
  clearInterval(clockTimer);
});
</script>

<template>
  <div class="page-relay">
    <div class="block">
      <div class="top-bar">
        <div class="gateway-name">EDGE_RELAY // 115613.XYZ</div>
        <div class="status-group">
          <div class="badge"><span class="live-dot"></span> SECURE RELAY</div>
          <span class="separator"></span>
          <div id="liveClock" class="time-stamp">{{ clock }}</div>
        </div>
      </div>

      <div class="ip-section">
        <div class="ip-label">INGRESS ADDRESS</div>
        <div id="mainIp" class="ip-address">{{ ip }}</div>
        <div id="ipHint" class="ip-aux">{{ ipHint }}</div>
      </div>

      <div id="dynamicMeta" class="info-panel">
        <div id="locationItem" class="info-item" v-show="hasLocation">
          <div id="locationValue" class="info-stat">{{ location }}</div>
          <div class="info-caption">LOCATION</div>
        </div>
      </div>

      <div id="footerText" class="footer-note">{{ footerText }}</div>
    </div>
  </div>
</template>

<style scoped src="../styles/view/relay.css"></style>
