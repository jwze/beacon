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
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { generateCardNumbers } from '@/lib/luhn';

const DEFAULT_PATTERN = '622848aaabbb';
const VALID_CHARS = /^[0-9a-zA-Z*]+$/;
const STATUS_AUTO_HIDE = 3000;
const COPY_FEEDBACK = 1500;

/** idle | loading | list | empty | error */
const view = ref('idle');

const pattern = ref('');
const inputEl = ref(null);
const results = ref([]);
const stats = ref({ patternLength: 0, count: 0, duration: '0ms' });
const status = ref({ text: '', type: '', visible: false });
const errorMessage = ref('');
const busy = ref(false);
const examplesOpen = ref(false);
const copiedIndex = ref(-1);

let statusTimer = null;
let copyTimer = null;

const showResults = () => view.value !== 'idle';
const showStats = () => view.value === 'list' || view.value === 'empty';

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
    showStatus('✗ 复制失败', 'error');
  }
}

function generate() {
  let value = pattern.value.trim();

  if (!value) {
    value = DEFAULT_PATTERN;
    pattern.value = value;
  }

  if (!VALID_CHARS.test(value)) {
    showStatus('⚠ 模式只能包含数字、字母和 * 或 x', 'error');
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

      if (list.length > 0) {
        showStatus(`✓ 成功生成 ${list.length} 个有效卡号`, 'success');
      } else {
        showStatus('ℹ 未找到符合条件的卡号', 'info');
      }
    } catch (error) {
      results.value = [];
      errorMessage.value = error.message;
      view.value = 'error';
      showStatus(`✗ 错误: ${error.message}`, 'error');
    } finally {
      busy.value = false;
    }
  }, 50);
}

function clearAll() {
  pattern.value = '';
  results.value = [];
  view.value = 'idle';
  status.value = { text: '', type: '', visible: false };
  copiedIndex.value = -1;
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
    <div class="container">
      <div class="header">
        <h1>⚡ LUHN GENERATOR</h1>
        <p class="subtitle">卢恩算法银行卡号生成器</p>
      </div>

      <div class="instructions">
        <h3>SYSTEM INSTRUCTIONS</h3>
        <ul>
          <li><strong>* / x</strong> 代表任意数字 (0-9)</li>
          <li><strong>相同字母</strong> 绑定相同数字值</li>
          <li><strong>数字</strong> 固定位置</li>
          <li><strong>自动校验</strong> 末位卢恩校验码</li>
        </ul>

        <div class="examples-wrapper">
          <div class="examples-header" @click="examplesOpen = !examplesOpen">
            <span class="examples-title">Examples</span>
            <span id="examplesToggle" class="examples-toggle" :class="{ expanded: examplesOpen }">▼</span>
          </div>
          <div id="examplesContent" class="examples" :class="{ expanded: examplesOpen }">
            622848aaabbb → 12位卡号 (前6位固定, 后6位分3组)<br />
            52**aabb → 8位卡号 (前2位固定, 中间2位任意, 后4位分2组)<br />
            6011xxxxxxxxxx → 14位卡号 (前4位固定, 后10位任意)
          </div>
        </div>
      </div>

      <div class="input-section">
        <div class="input-group">
          <input
            id="patternInput"
            ref="inputEl"
            v-model="pattern"
            type="text"
            placeholder="输入模式: 622848aaabbb"
            autocomplete="off"
            spellcheck="false"
            @keydown.enter="generate"
          />
          <button id="generateBtn" :disabled="busy" @click="generate">
            {{ busy ? 'PROCESSING...' : 'GENERATE' }}
          </button>
          <button class="clear-btn" @click="clearAll">CLEAR</button>
        </div>
        <div
          id="statusMessage"
          class="status-message"
          :class="status.type"
          v-show="status.visible"
        >
          {{ status.text }}
        </div>
      </div>

      <div id="statsSection" v-show="showStats()">
        <div class="stats">
          <div class="stat-card">
            <div id="statPattern" class="stat-value">{{ stats.patternLength }}</div>
            <div class="stat-label">Pattern Length</div>
          </div>
          <div class="stat-card">
            <div id="statResults" class="stat-value">{{ stats.count }}</div>
            <div class="stat-label">Results Found</div>
          </div>
          <div class="stat-card">
            <div id="statTime" class="stat-value">{{ stats.duration }}</div>
            <div class="stat-label">Generation Time</div>
          </div>
        </div>
      </div>

      <div id="resultsSection" class="results-section" v-show="showResults()">
        <div class="results-header">
          <h2>GENERATED RESULTS</h2>
          <div id="resultCount" class="result-count">{{ results.length }} ITEMS</div>
        </div>

        <div id="resultsContainer" class="results-container">
          <div v-if="view === 'loading'" class="loading">GENERATING</div>

          <template v-else-if="view === 'list'">
            <div v-for="(card, index) in results" :key="`${card}-${index}`" class="result-item">
              <span class="card-number">{{ card }}</span>
              <button
                class="copy-btn"
                :class="{ copied: copiedIndex === index }"
                @click="copyCard(card, index)"
              >
                {{ copiedIndex === index ? '✓' : 'COPY' }}
              </button>
            </div>
          </template>

          <div v-else-if="view === 'empty'" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 15s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <div>NO VALID RESULTS</div>
            <div>Try a different pattern</div>
          </div>

          <div v-else-if="view === 'error'" class="empty-state" style="color: var(--error-color)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <div>ERROR: {{ errorMessage }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/view/luhn.css"></style>
