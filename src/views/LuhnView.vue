<script setup>
/**
 * LUHN 卡号生成器
 *
 * 模式语法：
 *   数字 0-9  固定位
 *   * 或 x    任意数字
 *   a-z       同字母同数字（分组约束）
 * 末位需满足 Luhn 校验。
 * 算法实现见 src/lib/luhn.js，本组件只负责交互与渲染。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { generateCardNumbers } from '@/lib/luhn';
import { SITE_CONFIG } from '@/config/site';

const DEFAULT_PATTERN = '622848aaabbb';
const VALID_CHARS = /^[0-9a-zA-Z*]+$/;
const STATUS_AUTO_HIDE = 3000;
const COPY_FEEDBACK = 1500;

/** 左栏示例：点一下填进输入框，不自动生成（长模式的组合数可能极大） */
const SAMPLES = [
  { pattern: '622848aaabbb', meta: '12 位' },
  { pattern: '52**aabb', meta: '8 位' },
  { pattern: '6011xxxxxx', meta: '14 位' },
];

/** idle | loading | list | empty | error */
const view = ref('idle');

const pattern = ref('');
const inputEl = ref(null);
const results = ref([]);
const stats = ref({ patternLength: 0, count: 0, duration: '0ms' });
const status = ref({ text: '', type: '', visible: false });
const errorMessage = ref('');
const busy = ref(false);
const copiedIndex = ref(-1);

let statusTimer = null;
let copyTimer = null;

/** 跑过一次（有结果或空结果）才显示本次运行读数；没跑过就整块不占位 */
const hasRun = ref(false);
const countLabel = computed(() => stats.value.count.toLocaleString('zh-CN'));

/**
 * 结果格：卡号按 4 位分组，末组的最后一位是校验位，单独着色。
 * tail 是末组去掉校验位之后剩下的数字。
 */
function toRow(card) {
  const groups = [];
  for (let i = 0; i < card.length; i += 4) groups.push(card.slice(i, i + 4));

  const last = groups.pop() ?? '';
  return { card, groups, tail: last.slice(0, -1), check: last.slice(-1) };
}

/**
 * 生成前的示例输出：用默认模式真跑一遍（只有 100 组候选）。
 * 生成前后铺的是同一套格子，只是生成前压暗、不可点，
 * 所以结果区不会出现一块等着被填的空白占位。
 */
const SAMPLE_CARDS = (() => {
  try {
    return generateCardNumbers(DEFAULT_PATTERN);
  } catch {
    return [];
  }
})();

const rows = computed(() => results.value.map(toRow));
const sampleRows = SAMPLE_CARDS.map(toRow);

/** 模式位条：每一位按作用归类，展示模式的结构 */
function toSlots(source) {
  return [...source].map((char) => {
    if (char >= '0' && char <= '9') return { char, role: 'fixed' };
    if (char === '*' || char === 'x' || char === 'X') return { char, role: 'wild' };
    if (/[a-z]/i.test(char)) return { char, role: 'group' };
    return { char, role: 'invalid' };
  });
}

const slots = computed(() => toSlots(pattern.value.trim()));

/** 还没写模式时，位条演示默认模式的位结构，这一行不会空着 */
const SAMPLE_SLOTS = toSlots(DEFAULT_PATTERN);
const isSampleSlots = computed(() => slots.value.length === 0);
const readoutSlots = computed(() => (isSampleSlots.value ? SAMPLE_SLOTS : slots.value));

function showStatus(text, type = 'info') {
  status.value = { text, type, visible: true };

  clearTimeout(statusTimer);
  if (type === 'success' || type === 'error') {
    statusTimer = setTimeout(() => {
      status.value = { ...status.value, visible: false };
    }, STATUS_AUTO_HIDE);
  }
}

async function copyCard(card, index) {
  try {
    await navigator.clipboard.writeText(card);
    copiedIndex.value = index;

    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copiedIndex.value = -1;
    }, COPY_FEEDBACK);
  } catch {
    showStatus('复制失败，请手动选中号码', 'error');
  }
}

function generate() {
  let value = pattern.value.trim();

  if (!value) {
    value = DEFAULT_PATTERN;
    pattern.value = value;
  }

  if (!VALID_CHARS.test(value)) {
    showStatus('模式只能包含数字、字母和 * 或 x', 'error');
    return;
  }

  busy.value = true;
  copiedIndex.value = -1;
  view.value = 'loading';

  // 让浏览器先完成一次绘制，再执行可能密集的枚举
  setTimeout(() => {
    try {
      const startTime = performance.now();
      const list = generateCardNumbers(value);
      const duration = Math.round(performance.now() - startTime);

      results.value = list;
      stats.value = { patternLength: value.length, count: list.length, duration: `${duration}ms` };
      view.value = list.length > 0 ? 'list' : 'empty';
      hasRun.value = true;

      if (list.length > 0) {
        showStatus(`已生成 ${list.length} 个有效卡号`, 'success');
      } else {
        showStatus('没有符合条件的卡号', 'info');
      }
    } catch (error) {
      results.value = [];
      errorMessage.value = error.message;
      view.value = 'error';
      showStatus(`生成失败：${error.message}`, 'error');
    } finally {
      busy.value = false;
    }
  }, 50);
}

function clearAll() {
  pattern.value = '';
  results.value = [];
  view.value = 'idle';
  hasRun.value = false;
  status.value = { text: '', type: '', visible: false };
  copiedIndex.value = -1;
  inputEl.value?.focus();
}

function useSample(value) {
  pattern.value = value;
  inputEl.value?.focus();
}

onMounted(async () => {
  await nextTick();
  inputEl.value?.focus();
});

onBeforeUnmount(() => {
  clearTimeout(statusTimer);
  clearTimeout(copyTimer);
});
</script>

<template>
  <div class="page-luhn">
    <div class="shell">
      <header class="topbar">
        <div class="brand">
          <svg
            class="brand-mark"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            aria-hidden="true"
          >
            <rect x="1.2" y="3.4" width="13.6" height="9.2" rx="2" />
            <path d="M1.2 6.4h13.6" />
            <path d="M4.4 10.6l1.3 1.3 2.4-2.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="brand-name">luhn</span>
        </div>
        <router-link class="topbar-link" :to="{ name: 'home' }">← 首页</router-link>
      </header>

      <div class="grid">
        <aside class="side">
          <div class="intro">
            <h1>Luhn 卡号生成器</h1>
            <p class="intro-note">
              按模式枚举出满足 Luhn 校验的卡号。固定位照写，<code>*</code> 为任意数字，相同字母绑定同一个数字。
            </p>
          </div>

          <section class="block block-syntax">
            <h2 class="section-label">模式语法</h2>
            <ul class="rules">
              <li><code class="token">0-9</code><span>固定位，按字面写入</span></li>
              <li><code class="token">* / x</code><span>任意数字 0-9</span></li>
              <li><code class="token">a-z</code><span>同一字母绑定同一个数字</span></li>
              <li><code class="token">末位</code><span>由 Luhn 校验推导，无需填写</span></li>
            </ul>
          </section>

          <section v-if="!hasRun" class="block block-samples">
            <h2 class="section-label">示例</h2>
            <ul class="samples">
              <li v-for="sample in SAMPLES" :key="sample.pattern">
                <button class="sample" type="button" @click="useSample(sample.pattern)">
                  <code class="sample-pattern">{{ sample.pattern }}</code>
                  <span class="sample-meta">{{ sample.meta }}</span>
                </button>
              </li>
            </ul>
          </section>

          <div v-if="hasRun" class="side-readout">
            <h2 class="section-label">本次生成</h2>
            <dl class="params">
              <div class="param">
                <dt>模式</dt>
                <dd>{{ hasRun ? `${stats.patternLength} 位` : '—' }}</dd>
              </div>
              <div class="param">
                <dt>耗时</dt>
                <dd>{{ hasRun ? stats.duration : '—' }}</dd>
              </div>
            </dl>
          </div>

          <div class="side-foot">
            <p class="legend">
              <span class="legend-digit">9</span>
              <span>琥珀色是校验位，由 Luhn 反推</span>
            </p>
            <p class="copyright">{{ SITE_CONFIG.copyright }}</p>
          </div>
        </aside>

        <form class="work" @submit.prevent="generate">
          <div class="field">
            <label class="field-label" for="patternInput">模式</label>
            <input
              id="patternInput"
              ref="inputEl"
              v-model="pattern"
              class="field-input"
              type="text"
              placeholder="622848aaabbb"
              autocomplete="off"
              spellcheck="false"
            />
            <div class="field-actions">
              <button class="btn btn-quiet" type="button" @click="clearAll">清除</button>
              <button class="btn btn-primary" type="submit" :disabled="busy">
                {{ busy ? '生成中' : '生成' }}
              </button>
            </div>
          </div>

          <div class="readout">
            <div class="slots" :class="{ 'is-sample': isSampleSlots }" aria-hidden="true">
              <span v-for="(slot, i) in readoutSlots" :key="i" class="slot" :class="slot.role">
                {{ slot.char }}
              </span>
              <span class="slots-meta">{{ isSampleSlots ? '示例' : `${slots.length} 位` }}</span>
            </div>
            <p
              v-show="status.visible"
              class="status"
              :class="status.type"
              role="status"
              aria-live="polite"
            >
              <span class="status-dot" aria-hidden="true" />
              {{ status.text }}
            </p>
            <p v-if="!status.visible" class="readout-hint">按 Enter 生成</p>
          </div>
        </form>

        <section class="results">
          <div class="results-head">
            <h2 class="section-label">结果</h2>
            <p v-if="view === 'list'" class="results-hint">点按任意一格复制</p>
            <p v-else-if="view === 'idle'" class="results-hint">尚未生成，下面是示例</p>
          </div>

          <div v-if="view === 'list'" class="sheet">
            <button
              v-for="(row, index) in rows"
              :key="row.card"
              class="cell"
              :class="{ 'is-copied': copiedIndex === index }"
              type="button"
              :aria-label="`复制卡号 ${row.card}`"
              @click="copyCard(row.card, index)"
            >
              <span class="cell-index">
                {{ copiedIndex === index ? '已复制' : String(index + 1).padStart(3, '0') }}
              </span>
              <span class="card-number">
                <span v-for="(group, gi) in row.groups" :key="gi" class="card-group">{{ group }}</span>
                <span class="card-group">
                  {{ row.tail }}<span class="check-digit">{{ row.check }}</span>
                </span>
              </span>
            </button>
          </div>

          <div v-else-if="view === 'loading'" class="state">
            <span class="loading-bar" aria-hidden="true"><i /></span>
            <div class="state-head">
              <p class="state-title">正在枚举符合条件的卡号</p>
            </div>
          </div>

          <div v-else-if="view === 'empty'" class="state">
            <div class="state-head">
              <svg
                class="state-icon"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="7" />
                <path d="M6 9h6" stroke-linecap="round" />
              </svg>
              <p class="state-title">没有符合条件的卡号</p>
            </div>
            <p class="state-hint">换一个模式，或多留出几位任意位</p>
          </div>

          <div v-else-if="view === 'error'" class="state is-error">
            <div class="state-head">
              <svg
                class="state-icon"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="7" />
                <path d="M9 5.5v4.5" stroke-linecap="round" />
                <path d="M9 12.6v.1" stroke-linecap="round" />
              </svg>
              <p class="state-title">计算出错</p>
            </div>
            <p class="state-hint">{{ errorMessage }}</p>
          </div>

          <div v-else-if="view === 'idle'" class="preview">
            <div class="sheet is-sample" aria-hidden="true">
              <div v-for="(row, index) in sampleRows" :key="row.card" class="cell is-sample">
                <span class="cell-index">{{ String(index + 1).padStart(3, '0') }}</span>
                <span class="card-number">
                  <span v-for="(group, gi) in row.groups" :key="gi" class="card-group">{{
                    group
                  }}</span>
                  <span class="card-group">
                    {{ row.tail }}<span class="check-digit">{{ row.check }}</span>
                  </span>
                </span>
              </div>
            </div>

            <p class="results-foot">
              <span class="foot-count">示例输出</span>
              <span>{{ DEFAULT_PATTERN }} · {{ sampleRows.length }} 个卡号</span>
              <span>写模式后按 Enter 生成</span>
            </p>
          </div>

          <div v-if="view === 'list'" class="results-foot">
            <span class="foot-count">{{ countLabel }} 个卡号</span>
            <span>全部通过 Luhn 校验</span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/view/luhn.css"></style>
