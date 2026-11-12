/**
 * 首页
 * 背景粒子波浪 + 文字乱码动画 + 入口按钮渲染。
 */
import { SITE_CONFIG } from '../config/site.js';
import { initSecurityGuard } from '../security/guard.js';
import { TextScramble } from '../core/text-scramble.js';
import { createWavesBackground } from '../core/waves-background.js';

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

/** 依据配置渲染入口按钮 */
function renderButtons() {
  const holder = document.getElementById('buttons');
  if (!holder) return;

  const fragment = document.createDocumentFragment();
  SITE_CONFIG.buttons.forEach((button) => {
    const link = document.createElement('a');
    link.href = button.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = button.name;
    fragment.appendChild(link);
  });

  holder.replaceChildren(fragment);
}

/** 循环播放文字乱码动画 */
function playTextScramble() {
  const el = document.querySelector('.text');
  if (!el) return;

  const fx = new TextScramble(el);
  let index = 0;

  const next = () => {
    fx.setText(PHRASES[index]).then(() => {
      index = (index + 1) % PHRASES.length;
      setTimeout(next, NEXT_DELAY);
    });
  };

  fx.setText(PHRASES[0]).then(() => {
    index = 1;
    setTimeout(next, NEXT_DELAY);
  });
}

function bootstrap() {
  initSecurityGuard();
  renderButtons();
  playTextScramble();
  createWavesBackground(document.querySelector('.waves'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
