/**
 * LUHN 卡号生成器
 *
 * 模式语法：
 *   数字 0-9  固定位
 *   * 或 x    任意数字
 *   a-z       同字母同数字（分组约束）
 * 末位需满足 Luhn 校验。
 * 算法实现见 src/lib/luhn.js，本文件只负责交互与渲染。
 */
import { initSecurityGuard } from '../security/guard.js';
import { generateCardNumbers } from '../lib/luhn.js';

const DEFAULT_PATTERN = '622848aaabbb';
const VALID_CHARS = /^[0-9a-zA-Z*]+$/;
const STATUS_AUTO_HIDE = 3000;
const COPY_FEEDBACK = 1500;

/* ------------------------------- UI 层 ------------------------------- */

const dom = {};

function cacheDom() {
  dom.input = document.getElementById('patternInput');
  dom.generateBtn = document.getElementById('generateBtn');
  dom.status = document.getElementById('statusMessage');
  dom.resultsSection = document.getElementById('resultsSection');
  dom.resultsContainer = document.getElementById('resultsContainer');
  dom.resultCount = document.getElementById('resultCount');
  dom.statsSection = document.getElementById('statsSection');
  dom.statPattern = document.getElementById('statPattern');
  dom.statResults = document.getElementById('statResults');
  dom.statTime = document.getElementById('statTime');
}

function showStatus(message, type = 'info') {
  if (!dom.status) return;
  dom.status.textContent = message;
  dom.status.className = `status-message ${type}`;

  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      dom.status.style.display = 'none';
    }, STATUS_AUTO_HIDE);
  }
}

async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const originalText = button.textContent;
    button.textContent = '✓';
    button.classList.add('copied');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('copied');
    }, COPY_FEEDBACK);
  } catch {
    showStatus('✗ 复制失败', 'error');
  }
}

function renderResults(results) {
  dom.resultsContainer.innerHTML = results
    .map(
      (card) => `
            <div class="result-item">
                <span class="card-number">${card}</span>
                <button class="copy-btn" data-card="${card}">COPY</button>
            </div>
        `,
    )
    .join('');

  dom.resultCount.textContent = `${results.length} ITEMS`;
  showStatus(`✓ 成功生成 ${results.length} 个有效卡号`, 'success');
}

function renderEmpty() {
  dom.resultsContainer.innerHTML = `
        <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 15s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
            <div>NO VALID RESULTS</div>
            <div>Try a different pattern</div>
        </div>
    `;
  dom.resultCount.textContent = '0 ITEMS';
  showStatus('ℹ 未找到符合条件的卡号', 'info');
}

function renderError(error) {
  dom.resultsContainer.innerHTML = `
        <div class="empty-state" style="color: var(--error-color);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <div>ERROR: ${error.message}</div>
        </div>
    `;
  showStatus(`✗ 错误: ${error.message}`, 'error');
}

function generateCards() {
  let pattern = dom.input.value.trim();

  if (!pattern) {
    pattern = DEFAULT_PATTERN;
    dom.input.value = pattern;
  }

  if (!VALID_CHARS.test(pattern)) {
    showStatus('⚠ 模式只能包含数字、字母和 * 或 x', 'error');
    return;
  }

  dom.generateBtn.disabled = true;
  dom.generateBtn.textContent = 'PROCESSING...';
  dom.resultsContainer.innerHTML = '<div class="loading">GENERATING</div>';
  dom.resultsSection.style.display = 'block';
  dom.statsSection.style.display = 'none';

  // 让浏览器先完成一次绘制，再执行可能密集的枚举
  setTimeout(() => {
    try {
      const startTime = performance.now();
      const results = generateCardNumbers(pattern);
      const duration = Math.round(performance.now() - startTime);

      dom.statPattern.textContent = pattern.length;
      dom.statResults.textContent = results.length;
      dom.statTime.textContent = `${duration}ms`;
      dom.statsSection.style.display = 'block';

      if (results.length > 0) {
        renderResults(results);
      } else {
        renderEmpty();
      }
    } catch (error) {
      renderError(error);
    } finally {
      dom.generateBtn.disabled = false;
      dom.generateBtn.textContent = 'GENERATE';
    }
  }, 50);
}

function clearAll() {
  dom.input.value = '';
  dom.resultsSection.style.display = 'none';
  dom.statsSection.style.display = 'none';
  dom.status.style.display = 'none';
  dom.input.focus();
}

function toggleExamples() {
  document.getElementById('examplesContent')?.classList.toggle('expanded');
  document.getElementById('examplesToggle')?.classList.toggle('expanded');
}

function bindEvents() {
  dom.generateBtn.addEventListener('click', generateCards);
  document.querySelector('.clear-btn').addEventListener('click', clearAll);
  document.querySelector('.examples-header').addEventListener('click', toggleExamples);

  dom.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') generateCards();
  });

  // 结果区复制按钮（事件委托，避免为每个按钮绑定）
  dom.resultsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.copy-btn');
    if (!button) return;
    copyToClipboard(button.dataset.card, button);
  });

  window.addEventListener('load', () => dom.input.focus());
}

function bootstrap() {
  cacheDom();
  bindEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      initSecurityGuard();
      bootstrap();
    },
    { once: true },
  );
} else {
  initSecurityGuard();
  bootstrap();
}
