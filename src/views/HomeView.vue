<script setup>
/**
 * 首页
 * 背景粒子波浪 + 文字乱码动画 + 入口按钮。
 * WebGL 与动画实现放在 core/ 下，本组件只负责生命周期与装配。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { SITE_CONFIG } from '@/config/site';
import { TextScramble } from '@/core/text-scramble';
import { createWavesBackground } from '@/core/waves-background';

const PHRASES = [
  'Hi,',
  'Everyone',
  'Welcome to my site!',
  'How did you end up here?',
  'That’s really cool.',
  'Do you like this place?',
  'Please remember — Jvz',
];

const NEXT_DELAY = 800;

const wavesEl = ref(null);
const textEl = ref(null);

let waves = null;
let fx = null;
let timer = null;
let alive = true;

onMounted(() => {
  waves = createWavesBackground(wavesEl.value) ?? null;

  if (!textEl.value) return;
  fx = new TextScramble(textEl.value);

  let index = 0;
  const play = async () => {
    if (!alive) return;

    await fx.setText(PHRASES[index]);
    if (!alive) return;

    index = (index + 1) % PHRASES.length;
    timer = setTimeout(play, NEXT_DELAY);
  };

  play();
});

onBeforeUnmount(() => {
  alive = false;
  clearTimeout(timer);
  fx?.destroy();
  waves?.dispose();
  waves = null;
  fx = null;
});
</script>

<template>
  <div class="page-home">
    <div ref="wavesEl" class="waves"></div>

    <div id="wrap">
      <div class="container">
        <div ref="textEl" class="text">Hi,</div>
      </div>

      <div class="spacer"></div>

      <div class="buttons">
        <template v-for="item in SITE_CONFIG.nav" :key="item.name">
          <router-link v-if="item.route" :to="{ name: item.route }">{{ item.name }}</router-link>
          <a v-else :href="item.url" target="_blank" rel="noopener">{{ item.name }}</a>
        </template>
      </div>
    </div>

    <div class="logo">
      <img src="/logo.png" alt="Logo" />
    </div>

    <div class="footer">{{ SITE_CONFIG.copyright }}</div>
  </div>
</template>

<style scoped src="../styles/view/home.css"></style>
