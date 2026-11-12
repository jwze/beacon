/**
 * TextScramble —— 逐字符乱码解密动画
 *
 * setText() 返回 Promise，动画结束后 resolve，便于串联播放序列。
 */
export class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}?=+*^?#________';
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => {
      this.resolve = resolve;
    });

    this.queue = [];
    for (let i = 0; i < length; i += 1) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i += 1) {
      const { from, to, start, end } = this.queue[i];
      let { char } = this.queue[i];

      if (this.frame >= end) {
        complete += 1;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.resolve();
      return;
    }

    this.frameRequest = requestAnimationFrame(this.update);
    this.frame += 1;
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }

  /** 停止动画并释放待决 Promise（组件卸载时调用） */
  destroy() {
    cancelAnimationFrame(this.frameRequest);
    this.frameRequest = null;
    this.queue = [];

    if (this.resolve) {
      this.resolve();
      this.resolve = null;
    }
  }
}

export default TextScramble;
