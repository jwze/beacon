# beacon

个人站点 **115613.xyz** 的源码仓库。技术栈从「纯静态 HTML + 内联脚本」重构为 **Vite 驱动的多页面工程**，视觉与交互保持不变。

线上地址：<https://115613.xyz>

---

## 页面一览

| 路径 | 说明 |
| --- | --- |
| `/` | 首页：WebGL 粒子波浪背景 + 文字乱码动画 + 站点入口 |
| `/luhn.html` | LUHN 卡号生成器：按模式枚举满足 Luhn 校验的卡号 |
| `/relay.html` | Relay 展示页：显示访问者出口 IP 与归属地，异常流量会被引导至此 |
| `/404.html` | 错误页：5 秒后自动回到首页 |

## 技术栈

- **Vite 8**：多页面（MPA）构建、开发服务器、静态资源指纹化
- **原生 ES Modules**：不引入框架。页面逻辑简单、且含 WebGL 手写渲染，框架只会增加体积与不确定性
- **原生 WebGL**：粒子波浪由顶点着色器按 sin/cos 波形实时位移
- **无 CSS 框架**：样式为手写 CSS（全部沿用重构前文件，仅做拆分）
- **Node 18+**（开发与构建环境）

## 目录结构

```
beacon/
├── index.html              # 首页入口
├── luhn.html               # Luhn 生成器入口
├── relay.html              # Relay 展示页入口
├── vite.config.js          # 多页面入口与产物命名
├── package.json
├── public/                 # 原样拷贝到产物根目录的静态资源
│   ├── 404.html            # 错误页（含大量内联样式，保持原样）
│   ├── icon.ico
│   └── logo.png
├── src/
│   ├── config/
│   │   └── site.js         # 站点配置：标题、首页入口按钮
│   ├── core/
│   │   ├── shader-program.js    # 极简 WebGL 封装（着色器/缓冲区/矩阵）
│   │   ├── waves-background.js  # 粒子波浪实例与着色器源码
│   │   ├── particle-texture.js  # 粒子贴图（内联 base64）
│   │   └── text-scramble.js     # 文字乱码动画
│   ├── lib/
│   │   └── luhn.js         # Luhn 算法 + 卡号枚举（纯函数，无 DOM 依赖）
│   ├── security/
│   │   ├── config.js       # 防护阈值、白名单、可疑特征
│   │   └── guard.js        # 频率 / UA / 来源 / 连点检测与跳转
│   ├── pages/
│   │   ├── home.js         # 首页装配
│   │   ├── luhn.js         # 生成器交互层
│   │   ├── relay.js        # IP / 归属地展示
│   │   └── notfound.js     # 404 页仅挂安全防护
│   └── styles/
│       ├── main.css        # 首页样式（原 style.css + 原内联样式，按原顺序合并）
│       ├── luhn.css        # 生成器样式（原内联样式，原样提取）
│       └── relay.css       # relay 样式（原内联样式，原样提取）
└── test/
    └── luhn.test.mjs       # 算法回归测试
```

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
```

## 构建与本地预览

```bash
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览产物，http://localhost:4173
npm test           # Luhn 算法回归测试
```

构建产物：

```
dist/
├── index.html  luhn.html  relay.html
├── 404.html  icon.ico  logo.png
└── assets/     # 带 hash 的 CSS；入口 JS 固定名（供 404.html 引用）
```

## 部署（Cloudflare Pages + 自定义域名）

站点原先靠自建服务器（含 `/gitea`、`/speedtest`、`/probe` 反向代理）承载，现改为 Cloudflare Pages 托管静态产物。

### 1. 创建 Pages 项目

Cloudflare Dashboard → Workers & Pages → Create → Pages → 连接 Git 仓库，或直接用命令行：

```bash
npm run build
npx wrangler pages deploy dist --project-name=beacon
```

构建配置（Git 集成方式）：

| 配置项 | 值 |
| --- | --- |
| Framework preset | None / Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `20`（环境变量 `NODE_VERSION=20`） |

### 2. 绑定域名 115613.xyz

1. 把 `115613.xyz` 的 NS 托管到 Cloudflare（域名已在 Cloudflare 管理则跳过）。
2. Pages 项目 → **Custom domains** → Set up a custom domain → 输入 `115613.xyz` → 自动写入 CNAME/A 记录并签发证书。
3. 建议再添加 `www.115613.xyz`，并用 Bulk Redirects 或 Redirect Rules 做 `www → 裸域` 的 301，避免重复收录。
4. 证书状态变为 **Active** 后即可访问；如需强制 HTTPS，打开 SSL/TLS → Edge Certificates → **Always Use HTTPS**。

`dist/404.html` 会被 Pages 自动作为未匹配路径的响应页，无需额外配置。

### 3. 关于 `/gitea`、`/speedtest`、`/probe`

这三个入口指向原服务器的反向代理路径，**Pages 本身不提供反代能力**。两种处理方式：

- 保留 Cloudflare Tunnel 把原服务挂到同域名的这些路径上（推荐，改动最小）；
- 或者把 `src/config/site.js` 里的 `url` 改成各自独立的子域名（如 `https://gitea.115613.xyz`）。

## 重构对照

| 重构前 | 重构后 |
| --- | --- |
| `style.css` + `index.html` 内联 `<style>` | `src/styles/main.css`（按原顺序合并，样式声明未改动） |
| `luhn.html` 内联 `<style>`（约 900 行） | `src/styles/luhn.css`（原样提取） |
| `relay.html` 内联 `<style>` | `src/styles/relay.css`（原样提取） |
| `config.js` 全局变量 `SITE_CONFIG` | `src/config/site.js`（ESM 导出） |
| `security.js` + `guard.js` 经典脚本 + IIFE | `src/security/config.js` + `src/security/guard.js`（ESM，`initSecurityGuard()`） |
| `main.js` 的 `TextScramble` | `src/core/text-scramble.js` |
| `index.html` 内联的 `ShaderProgram` 与波浪配置 | `src/core/shader-program.js`、`src/core/waves-background.js` |
| `luhn.html` 内联的算法与 UI 逻辑 | `src/lib/luhn.js`（算法）+ `src/pages/luhn.js`（交互） |
| 内联 `onclick` 属性 | `addEventListener` 绑定（含结果区事件委托） |
| 直接部署静态文件 | `npm run build` → `dist/` |

## 与原版的差异说明

重构以「不改变外观」为前提，样式文件是原文件的机械拆分。以下几处是**有意为之的行为变化**：

1. **粒子波浪恢复渲染**。原 `ShaderProgram.updateBuffers()` 中有一处变量名笔误（`buffer.data` 引用了未定义的 `buffer`），构造时即抛 `ReferenceError`，导致首页背景动画实际上从未渲染，只剩纯黑背景。重构时修正为按名称重新上传缓冲区，波浪效果按原着色器参数正常显示。若需保持「纯黑无动画」，在 `src/pages/home.js` 中移除 `createWavesBackground(...)` 调用即可。
2. **relay 页的域名文案**。原文案与探测地址写的是 `zzze.me`，已改为本站域名 `115613.xyz`，`/cdn-cgi/trace` 也改为同源请求并保留第三方 IP 接口降级。
3. **网络请求加了 6 秒超时**（`AbortController`），避免第三方 IP 接口无响应时页面一直停在 `--`。
4. **`security.js` 的 `redirectUrl`** 仍为 `/relay.html`，白名单路径保持一致。

## 安全防护说明

`src/security/guard.js` 是纯浏览器侧检测：每分钟请求数、UA 关键词、来源关键词、连点频率。命中后写入 `localStorage` 冷却标记并跳转 `/relay.html`。

它只能挡住最低级的扫描器，**不能替代服务端防护**：请求在进入浏览器前就已经到达源站。真正的限流与拦截应在 Cloudflare（WAF / Rate limiting 规则）或反代层完成。

## License

MIT
