# beacon

个人站点 **115613.xyz** 的源码仓库。技术栈为 **Vue 3 + Vue Router + Vite 的 SPA**：一个 HTML 入口，页面按路由懒加载，未匹配路径统一落到 404 视图，反代路径（如 `/gitea`）由配置驱动、不会被 SPA 吞掉。

线上地址：<https://115613.xyz>

---

## 页面一览

| 路径 | 说明 | 视图文件 |
| --- | --- | --- |
| `/` | 首页：WebGL 粒子波浪背景 + 文字乱码动画 + 站点入口 | `src/views/HomeView.vue` |
| `/luhn` | LUHN 卡号生成器：按模式枚举满足 Luhn 校验的卡号 | `src/views/LuhnView.vue` |
| `/relay` | Relay 展示页：显示访问者出口 IP 与归属地，异常流量会被引导至此 | `src/views/RelayView.vue` |
| 其它任意路径 | 404 页：**与原 `public/404.html` 逐像素一致**，5 秒后自动回首页 | `src/views/NotFoundView.vue` |
| 反代路径（`/gitea` 等） | 不属于 SPA；服务端漏配时显示诊断页而不是 404 | `src/views/ProxyPendingView.vue` |

旧地址 `/luhn.html`、`/relay.html`、`/index.html` 由路由重定向到新地址，外链和搜索引擎收录不会失效。

## 技术栈

- **Vue 3**（组合式 API + `<script setup>`）：视图是单文件组件，状态与生命周期跟着组件走，页面切换时 WebGL、定时器、时钟都能干净销毁
- **Vue Router 5**：history 模式，路由表即站点结构，`meta` 驱动标题 / 布局类 / `<html lang>` / viewport
- **Vite 8**：开发服务器、单入口构建、路由级代码与样式分割
- **原生 WebGL**：粒子波浪由顶点着色器按 sin/cos 波形实时位移，封装在 `src/core/`
- **无 CSS 框架**：手写 CSS，按「布局层 / 视图层」两级拆分
- **Node 20.19+ 或 22.12+**（Vite 8 与 `@vitejs/plugin-vue` 的要求）

## 目录结构

```
beacon/
├── index.html              # 唯一 HTML 入口（SPA 外壳）
├── vite.config.js          # vue 插件、@ 别名、构建产物命名
├── package.json
├── deploy/nginx/           # ⚠️ 由 npm run proxy:sync 生成，勿手改
│   ├── beacon-upstreams.conf    # http 级：upstream + WebSocket map
│   └── beacon-locations.conf    # server 级：反代 location + SPA 回退
├── public/                 # 原样拷贝到产物根目录
│   ├── 404.html            # 原版 404 静态页（不支持重写的托管环境用）
│   ├── _redirects          # ⚠️ 由 proxy:sync 生成，Cloudflare Pages 回退规则
│   ├── _headers            # 响应头
│   ├── icon.ico
│   └── logo.png
├── scripts/
│   └── generate-proxy-config.mjs  # 读 config/external.js → 生成 nginx 配置与 _redirects
├── src/
│   ├── main.js             # createApp + router + 全局样式
│   ├── App.vue             # 路由出口 + 切换过渡
│   ├── router/
│   │   ├── index.js        # 路由实例；beforeEach 拦反代路径，afterEach 处理页面外壳
│   │   └── routes.js       # 路由表（新增页面的唯一登记处）
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── LuhnView.vue
│   │   ├── RelayView.vue
│   │   ├── FallbackView.vue      # 未匹配路径出口：反代 → 诊断页，其余 → 404
│   │   ├── NotFoundView.vue      # 原版 404 页（标记与样式逐字搬运）
│   │   └── ProxyPendingView.vue  # 反代未就绪诊断页
│   ├── config/
│   │   ├── site.js         # 站点配置：标题、版权、首页入口（反代按钮自动生成）
│   │   └── external.js     # ★ 反代路径的唯一配置源
│   ├── core/               # 与框架无关的渲染能力
│   │   ├── shader-program.js    # 极简 WebGL 封装（含 dispose）
│   │   ├── waves-background.js  # 粒子波浪实例与着色器源码
│   │   ├── particle-texture.js  # 粒子贴图（内联 base64）
│   │   └── text-scramble.js     # 文字乱码动画（含 destroy）
│   ├── lib/
│   │   ├── luhn.js         # Luhn 算法 + 卡号枚举（纯函数）
│   │   ├── relay.js        # 出口 IP / 归属地查询（纯函数，逐级降级）
│   │   └── proxy-hop.js    # 反代路径「只整页跳一次」的防循环保护
│   ├── security/
│   │   ├── config.js       # 防护阈值、白名单、可疑特征
│   │   └── guard.js        # createGuard()：频率 / UA / 来源 / 连点检测
│   └── styles/
│       ├── base.css        # 全局重置、#app、路由过渡
│       ├── layout/         # 布局层：body.page-<layout> 的底色、字体、装饰层
│       │   ├── home.css  luhn.css  relay.css  notfound.css
│       └── view/           # 视图层：页面内元素样式，由视图引入
│           ├── home.css  luhn.css  relay.css  proxy-pending.css
│           └── notfound.css     # 原版 404 的内联样式（全局，不做 scoped）
└── test/
    ├── luhn.test.mjs       # 算法回归测试
    ├── router.test.mjs     # 路由表 / 兜底路由 / 404 外壳设置
    └── proxy.test.mjs      # 反代路径与生成配置的一致性
```

### 样式为什么分两层

SPA 里所有页面的样式会同时存在于同一个文档中，`body { background }`、`.container` 这类选择器必然互相覆盖。因此拆成两级：

| 层级 | 位置 | 加载方式 | 作用域 |
| --- | --- | --- | --- |
| 布局层 | `src/styles/layout/*.css` | `main.js` 一次性引入 | 用 `body.page-<layout>` 前缀门控，只有当前路由的 body 类生效 |
| 视图层 | `src/styles/view/*.css` | 视图内 `<style scoped src="...">` | 编译期加 `[data-v-*]` 属性，只在对应组件内生效，且随路由懒加载 |

`body.page-<layout>` 由 `router/index.js` 的 `afterEach` 根据 `route.meta.layout` 切换，同时会清掉上一个页面的类。

两个例外，都是为了「原样保留」：

- `TextScramble` 运行时注入的 `<span class="dud">` 不带 `[data-v]`，`.dud` 样式留在 `layout/home.css` 全局层。
- 原版 404 的样式（`view/notfound.css`）在视图里用 `import` 引入、保持全局：它大量用 `-webkit-/-moz-/-o-animation` 前缀引用 `@keyframes`，scoped 编译会重命名 keyframes 而前缀写法不会同步，动画会失效。其选择器只有 `#head-*` / `#t-ov` / `.motime`，不会污染其它页面。

## 404 捕获链路

未匹配路径有三道网，任何一层单独失效都不会白屏：

1. **路由兜底**：`src/router/routes.js` 最后一条 `{ path: '/:pathMatch(.*)*' }` → `FallbackView`，命中任意深度、任意后缀的路径。
2. **托管回退**：`public/_redirects` 的 `/* /index.html 200`（nginx 则是 `try_files $uri $uri/ /index.html`），让直接访问 `/a/b/c` 这类深链也返回 SPA 入口，再由第 1 层接管；`/assets/*` 单独回 404，避免缺失资源返回 HTML。
3. **静态兜底**：`public/404.html`，给不支持重写的托管环境用。

SPA 的 404 是**客户端渲染**的，HTTP 状态码仍是 200。要返回真正的 404 状态码，只能在边缘用 Cloudflare Pages Functions / Workers 或 nginx 的 `error_page` 做判断，本仓库没有引入该复杂度。

### 404 页 = 原页面的 100% 还原

原 `public/404.html` 是那个「卡通蚂蚁 + 邮箱 + 正在为您跳转」的页面。SPA 版本按下面的方式做到**逐像素一致**：

| 原页面的特征 | 处理方式 |
| --- | --- |
| 标记结构 `#t-ov > .motime > 11 个 #head-*` | 原样搬进 `NotFoundView.vue` |
| 内联 `<style>`（22 KB，含 -webkit/-moz/-o 前缀动画） | 拆成 `layout/notfound.css`（`body` 规则）+ `view/notfound.css`（其余 54 条规则，声明未改） |
| `body{min-width:320px;background:#333}`，且**没有做任何 reset** | 用 `body.page-notfound` 承载，并把 `base.css` 重置掉的 UA 默认值用 `revert` 还原：body 8px 外边距、h1/blockquote/p 外边距、`content-box`（mascot 的 `width + border` 拼形状依赖它） |
| `<meta http-equiv="refresh" content="5;url=/">` | 5 秒后 `router.replace('/')` |
| `<title>Error Page</title>`、无 `lang`、无 viewport meta | 路由 `meta: { title: 'Error Page', lang: null, viewport: null }` |
| 加载 `/assets/notfound.js` 挂安全防护 | SPA 里防护已由 router 全局接管，无需重复挂载 |
| 两个 `<span>` 之间的换行渲染出一个空格 | Vue 编译会丢掉纯空白节点，用 `{{ ' ' }}` 显式补回 |

验证方式：用 Playwright 把「静态 dist/404.html」与「路由兜底渲染的 404」各截一张全页图，暂停并同步所有动画到同一时刻后做像素比对 —— 桌面 1280×800 与移动 390×844（2x）均为 **0 像素差异**。

> `public/404.html` 也换回了原文件，只删掉一行已经失效的 `<script src="/assets/notfound.js">`。

## 反代路径（`/gitea`、`/speedtest`、`/probe` …）

站点把一些路径用 nginx 反代给别的项目。这类路径**不属于 SPA**，必须满足两点：加一条配置就能用，且永远不会被 404 匹配到。

### 一处配置

`src/config/external.js` 是唯一配置源：

```js
export const EXTERNAL_PATHS = [
  { prefix: '/gitea', label: 'Gitea', upstream: '127.0.0.1:3000' },
  { prefix: '/speedtest', label: 'SpeedTest', upstream: '127.0.0.1:8081' },
  { prefix: '/probe', label: 'Probe', upstream: '127.0.0.1:8082' },
];
```

新增一条后执行：

```bash
npm run proxy:sync            # 重新生成 nginx 配置 + public/_redirects
nginx -t && nginx -s reload   # 应用
```

（`npm run build` 会自动先跑 `proxy:sync`。）

### 它同时影响三件事

| 位置 | 行为 |
| --- | --- |
| 前端路由 | `router.beforeEach` 命中前缀 → 整页跳转一次交给 nginx；若被打回则渲染诊断页，**不进入 404 分支** |
| 首页入口 | `config/site.js` 按 `EXTERNAL_PATHS` 自动生成按钮（顺序由 `NAV_ORDER` 决定，未列出的追加到末尾） |
| 部署配置 | 生成 `deploy/nginx/beacon-upstreams.conf`（upstream）、`deploy/nginx/beacon-locations.conf`（location）、`public/_redirects`（Pages 兜底顺序） |

前缀按「路径段」匹配：`/gitea`、`/gitea/user/repo` 命中，`/giteax` 不命中。

### nginx 怎么接

```nginx
# http {}
include /etc/nginx/conf.d/beacon-upstreams.conf;

# server {}
include /etc/nginx/conf.d/beacon-locations.conf;
```

生成的内容保证了这个顺序，`/gitea` 不会被 `try_files ... /index.html` 吞掉：

```nginx
location = /gitea { return 301 /gitea/; }
location ^~ /gitea/ { proxy_pass http://beacon_gitea; ... }
location /assets/ { try_files $uri =404; }
location /        { try_files $uri $uri/ /index.html; }
```

两个注意点：

- `proxy_pass http://beacon_gitea;`（不带斜杠）会保留 `/gitea` 前缀转发，Gitea 需要配 `ROOT_URL=https://115613.xyz/gitea/`；若上游只能跑在根路径，改成 `proxy_pass http://beacon_gitea/;` 即可（带斜杠 = 剥掉前缀），生成文件里也有这行注释。
- `upstream` 里的端口是示例值，接新服务时改 `src/config/external.js` 的 `upstream` 再同步。

### 漏配时会发生什么

不会出现「反代路径显示 404」：SPA 会先尝试整页跳转一次，若 3 秒内又被打回（说明 nginx 没接管），就渲染 `ProxyPendingView` 诊断页，直接告诉你「请求打到了前端入口、缺少 `location /gitea/`、上游地址是什么」，并给出 `npm run proxy:sync` 的提示。防循环逻辑在 `src/lib/proxy-hop.js`（sessionStorage 记 3 秒足迹），不会无限重载。

### 一致性有测试兜底

`test/proxy.test.mjs` 会检查：nginx 的 `location`/`upstream` 覆盖全部前缀、`_redirects` 里反代规则排在 `/*` 通配之前、首页按钮包含全部前缀。加了配置忘了同步，`npm test` 直接失败。

## 新增一个页面

1. 新建 `src/views/FooView.vue`；
2. 需要页面级背景/字体时，在 `src/styles/layout/foo.css` 里用 `body.page-foo` 写；
3. 在 `src/router/routes.js` 的 `not-found` **之前**追加：

```js
{
  path: '/foo',
  name: 'foo',
  component: () => import('../views/FooView.vue'),
  meta: { title: 'Foo', layout: 'foo', lang: 'zh-CN' },
}
```

4. 想让它出现在首页，就在 `src/config/site.js` 的 `INTERNAL_NAV` 加一条并把 key 放进 `NAV_ORDER`（`route` 渲染成 `<router-link>`，`url` 渲染成新窗口外链）。

`meta` 缺字段会被 `test/router.test.mjs` 拦住，避免出现无标题、无样式的页面。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
```

开发服务器与 `vite preview` 都带 history 回退，直接访问 `/luhn`、`/a/b/c` 都能正常打开；但反代路径在本地没有 nginx，会落到诊断页，这是预期行为。

## 构建与测试

```bash
npm run build      # 先 proxy:sync，再 vite build → dist/
npm run preview    # 本地预览产物，http://localhost:4173
npm test           # Luhn 算法 + 路由表 + 反代配置一致性（共 17 项）
```

构建产物：

```
dist/
├── index.html              # SPA 入口
├── 404.html  _headers  _redirects  icon.ico  logo.png
└── assets/
    ├── index-*.js          # 应用与 Vue 运行时（约 40 KB gzip）
    ├── HomeView-*.js/css   # 按路由分割的页面代码与样式
    ├── LuhnView-*.js/css
    ├── RelayView-*.js/css
    └── FallbackView-*.js/css   # 404 与诊断页（含原版 404 样式，约 1.8 KB gzip）
```

首页不会下载 luhn / relay / 404 的代码与样式。

## 部署

### nginx（当前方式）

```bash
npm run build
rsync -a dist/ /var/www/beacon/dist/
# 首次：把 deploy/nginx/*.conf 放进 /etc/nginx/conf.d/ 并在站点 server{} 里 include
nginx -t && nginx -s reload
```

站点 `server{}` 里需要 `root /var/www/beacon/dist;` 与 `index index.html;`，其余 location 由生成的片段提供。

### Cloudflare Pages（备选）

| 配置项 | 值 |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22`（`NODE_VERSION=22`） |

`dist/_redirects` 随产物上传，Pages 据此把未知路径回退到 `index.html`；反代前缀在 `_redirects` 里显式排在通配之前，避免被吞。若继续用 Cloudflare Tunnel 暴露 `/gitea`，把这三条规则交给边缘的 Tunnel / Origin Rules 处理即可。

## 从 MPA 迁移到 SPA 的对照

| 迁移前（Vite MPA） | 迁移后（Vue 3 SPA） |
| --- | --- |
| `pages/index.html`、`luhn.html`、`relay.html` 三个入口 | 根目录单个 `index.html` + `src/views/*.vue` |
| `build.rollupOptions.input` 逐页登记 | 路由表 `src/router/routes.js` 即页面清单 |
| `src/pages/*.js` 手动缓存 DOM、`document.getElementById` | `<script setup>` 的 `ref` / `v-model`，无手动 DOM 查找 |
| `innerHTML` 拼接结果列表 | `v-for` 渲染，无字符串注入 |
| 每个页面各自 `initSecurityGuard()` | `router.afterEach` 统一 `guard.check()`，监听只装一次 |
| `body` / `:root` / `.container` 全页样式 | 布局层（`body.page-*` 门控）+ 视图层（scoped） |
| `public/404.html` 靠 meta refresh 跳转 | 路由 catch-all 渲染同一个 404 页 + 静态兜底保留 |
| 反代路径靠 nginx 手写 location | `config/external.js` 一处配置 → 生成 nginx / `_redirects` |

### 行为变化（有意为之）

1. **URL 去掉 `.html`**：`/luhn.html` → `/luhn`，`/relay.html` → `/relay`；旧地址由路由 redirect 跳到新地址（客户端跳转，不是 HTTP 301）。
2. **站内入口同一标签页打开**：首页的 `Luhn` 是 `<router-link>`，不再 `target="_blank"`；反代入口仍是新窗口。
3. **404 页与原版完全一致**（详见上文），只是从「静态页 + meta refresh」变成「路由渲染 + 5 秒定时跳转」。
4. **粒子波浪、乱码动画、Luhn 算法与全部视觉细节未改动**，只是换成组件生命周期管理（切页时会 `dispose()` WebGL 上下文、清理定时器）。

## 安全防护说明

`src/security/guard.js` 是纯浏览器侧检测：每分钟请求数（按路由导航计）、UA 关键词、来源关键词、连点频率。命中后写入 `localStorage` 冷却标记并跳转 `/relay`；`/relay` 在路由 `meta.public` 与 `whitelistPaths` 中都被放行，避免跳转死循环。

它只能挡住最低级的扫描器，**不能替代服务端防护**：请求在进入浏览器前就已经到达源站。真正的限流与拦截应在 nginx / Cloudflare（WAF、rate limit）完成。

## License

MIT
