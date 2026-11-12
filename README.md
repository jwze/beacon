# beacon

个人站点 **115613.xyz** 的源码仓库。技术栈为 **Vue 3 + Vue Router + Vite 的 SPA**：一个 HTML 入口，页面按路由懒加载，未匹配路径统一落到 404 视图。

线上地址：<https://115613.xyz>

---

## 页面一览

| 路径 | 说明 | 视图文件 |
| --- | --- | --- |
| `/` | 首页：WebGL 粒子波浪背景 + 文字乱码动画 + 站点入口 | `src/views/HomeView.vue` |
| `/luhn` | LUHN 卡号生成器：按模式枚举满足 Luhn 校验的卡号 | `src/views/LuhnView.vue` |
| `/relay` | Relay 展示页：显示访问者出口 IP 与归属地，异常流量会被引导至此 | `src/views/RelayView.vue` |
| 其它任意路径 | 404 兜底页：回显请求路径，5 秒后自动回首页（可取消） | `src/views/NotFoundView.vue` |

旧地址 `/luhn.html`、`/relay.html`、`/index.html` 由路由重定向到新地址，外链和搜索引擎收录不会失效。

## 技术栈

- **Vue 3**（组合式 API + `<script setup>`）：视图是单文件组件，状态与生命周期跟着组件走，页面切换时 WebGL、定时器、时钟都能干净销毁
- **Vue Router 5**：history 模式，路由表即站点结构，`meta` 驱动标题 / 布局类 / `<html lang>`
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
├── public/                 # 原样拷贝到产物根目录
│   ├── 404.html            # 静态 404 兜底（不支持重写的托管环境用）
│   ├── _redirects          # Cloudflare Pages 回退规则（SPA 关键配置）
│   ├── _headers            # 响应头
│   ├── icon.ico
│   └── logo.png
├── src/
│   ├── main.js             # createApp + router + 全局样式
│   ├── App.vue             # 路由出口 + 切换过渡
│   ├── router/
│   │   ├── index.js        # 路由实例；afterEach 统一处理标题 / body 类 / 安全防护
│   │   └── routes.js       # 路由表（新增页面的唯一登记处）
│   ├── views/              # 页面视图（每个路由一个 .vue）
│   │   ├── HomeView.vue
│   │   ├── LuhnView.vue
│   │   ├── RelayView.vue
│   │   └── NotFoundView.vue
│   ├── config/
│   │   └── site.js         # 站点配置：标题、版权、首页入口按钮
│   ├── core/               # 与框架无关的渲染能力
│   │   ├── shader-program.js    # 极简 WebGL 封装（含 dispose）
│   │   ├── waves-background.js  # 粒子波浪实例与着色器源码
│   │   ├── particle-texture.js  # 粒子贴图（内联 base64）
│   │   └── text-scramble.js     # 文字乱码动画（含 destroy）
│   ├── lib/
│   │   ├── luhn.js         # Luhn 算法 + 卡号枚举（纯函数）
│   │   └── relay.js        # 出口 IP / 归属地查询（纯函数，逐级降级）
│   ├── security/
│   │   ├── config.js       # 防护阈值、白名单、可疑特征
│   │   └── guard.js        # createGuard()：频率 / UA / 来源 / 连点检测
│   └── styles/
│       ├── base.css        # 全局重置、#app、路由过渡
│       ├── layout/         # 布局层：body.page-<layout> 的底色、字体、装饰层
│       │   ├── home.css  luhn.css  relay.css  notfound.css
│       └── view/           # 视图层：页面内元素样式，由视图以 scoped 方式引入
│           ├── home.css  luhn.css  relay.css  notfound.css
└── test/
    ├── luhn.test.mjs       # 算法回归测试
    └── router.test.mjs     # 路由表回归测试（兜底路由是否在最后、meta 是否齐全等）
```

### 样式为什么分两层

SPA 里所有页面的样式会同时存在于同一个文档中，`body { background }`、`.container` 这类选择器必然互相覆盖。因此拆成两级：

| 层级 | 位置 | 加载方式 | 作用域 |
| --- | --- | --- | --- |
| 布局层 | `src/styles/layout/*.css` | `main.js` 一次性引入 | 用 `body.page-<layout>` 前缀门控，只有当前路由的 body 类生效 |
| 视图层 | `src/styles/view/*.css` | 视图内 `<style scoped src="...">` | 编译期加 `[data-v-*]` 属性，只在对应组件内生效，且随路由懒加载 |

`body.page-<layout>` 由 `router/index.js` 的 `afterEach` 根据 `route.meta.layout` 切换，同时会清掉上一个页面的类。

> 例外：`TextScramble` 在运行时注入 `<span class="dud">`，这类节点不带 `[data-v]` 属性，所以 `.dud` 的样式留在 `layout/home.css` 全局层。

## 404 捕获链路

未匹配路径有三道网，任何一层单独失效都不会白屏：

1. **路由兜底**：`src/router/routes.js` 最后一条 `{ path: '/:pathMatch(.*)*', name: 'not-found' }`，命中任意深度、任意后缀的路径，渲染 `NotFoundView`（回显原路径、5 秒倒计时回首页、可取消、可返回上一页）。
2. **托管回退**：`public/_redirects` 中的 `/* /index.html 200`，让直接访问 `/a/b/c` 这类深链也返回 SPA 入口，再由第 1 层接管；`/assets/*` 单独回 404，避免缺失的静态资源返回 HTML。
3. **静态兜底**：`public/404.html`，给不支持重写规则的托管环境（或纯静态服务器）用，样式与站点一致、5 秒自动回首页。

需要注意：SPA 的 404 是**客户端渲染**的，HTTP 状态码仍是 200（云端没匹配到静态文件就回退了入口）。要返回真正的 404 状态码，只能在边缘用 Cloudflare Pages Functions 或 Workers 做判断，本仓库没有引入该复杂度。

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

4. 想让它出现在首页入口按钮里，就在 `src/config/site.js` 的 `nav` 中加 `{ name: 'Foo', route: 'foo' }`（`route` 渲染成站内 `<router-link>`，`url` 渲染成新窗口外链）。

`meta` 缺字段会被 `test/router.test.mjs` 拦住，避免出现无标题、无样式的页面。

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
```

开发服务器与 `vite preview` 都带 history 回退，直接访问 `/luhn`、`/a/b/c` 都能正常打开。

## 构建与测试

```bash
npm run build      # 产物输出到 dist/
npm run preview    # 本地预览产物，http://localhost:4173
npm test           # Luhn 算法 + 路由表回归测试
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
    └── NotFoundView-*.js/css
```

首页不会下载 luhn / relay 的代码与样式，访问对应路由时才拉取。

## 部署（Cloudflare Pages + 自定义域名）

### 1. 创建 Pages 项目

Cloudflare Dashboard → Workers & Pages → Create → Pages → 连接 Git 仓库，或命令行：

```bash
npm run build
npx wrangler pages deploy dist --project-name=beacon
```

构建配置（Git 集成方式）：

| 配置项 | 值 |
| --- | --- |
| Framework preset | Vue / Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22`（环境变量 `NODE_VERSION=22`） |

### 2. 绑定域名 115613.xyz

1. 把 `115613.xyz` 的 NS 托管到 Cloudflare（域名已在 Cloudflare 管理则跳过）。
2. Pages 项目 → **Custom domains** → Set up a custom domain → 输入 `115613.xyz` → 自动写入 CNAME/A 记录并签发证书。
3. 建议再添加 `www.115613.xyz`，并用 Bulk Redirects 或 Redirect Rules 做 `www → 裸域` 的 301，避免重复收录。
4. 证书状态变为 **Active** 后即可访问；如需强制 HTTPS，打开 SSL/TLS → Edge Certificates → **Always Use HTTPS**。

`dist/_redirects` 会随产物一起上传，Pages 据此把未知路径回退到 `index.html`，深链与刷新都不会 404。

### 3. 关于 `/gitea`、`/speedtest`、`/probe`

这三个入口指向原服务器的反向代理路径，**Pages 本身不提供反代能力**。两种处理方式：

- 保留 Cloudflare Tunnel 把原服务挂到同域名的这些路径上（推荐，改动最小）；
- 或者把 `src/config/site.js` 里的 `url` 改成各自独立的子域名（如 `https://gitea.115613.xyz`）。

注意：`_redirects` 的 `/* /index.html 200` 会命中这三个路径。若仍走 Tunnel，需要在 `_redirects` 中把 `/gitea/*`、`/speedtest/*`、`/probe/*` 放到回退规则**之前**并配置为代理，或改用 Cloudflare 的 Redirect/Origin Rules，在边缘分流。

## 从 MPA 迁移到 SPA 的对照

| 迁移前（Vite MPA） | 迁移后（Vue 3 SPA） |
| --- | --- |
| `pages/index.html`、`luhn.html`、`relay.html` 三个入口 | 根目录单个 `index.html` + `src/views/*.vue` |
| `build.rollupOptions.input` 逐页登记 | 路由表 `src/router/routes.js` 即页面清单 |
| `src/pages/*.js` 手动缓存 DOM、`document.getElementById` | `<script setup>` 的 `ref` / `v-model`，无手动 DOM 查找 |
| `innerHTML` 拼接结果列表 | `v-for` 渲染，无字符串注入 |
| 每个页面各自 `initSecurityGuard()` | `router.afterEach` 统一 `guard.check()`，监听只装一次 |
| `body` / `:root` / `.container` 全页样式 | 布局层（`body.page-*` 门控）+ 视图层（scoped） |
| `public/404.html` 靠 meta refresh 跳转 | 路由 catch-all 渲染 404 视图 + 静态兜底保留 |
| `src/styles/main.css` 等三份整页样式 | `styles/layout/` 与 `styles/view/` 各四份 |

### 行为变化（有意为之）

1. **URL 去掉 `.html`**：`/luhn.html` → `/luhn`，`/relay.html` → `/relay`；旧地址由路由 redirect 记录跳到新地址（客户端跳转，不是 HTTP 301，日志与状态码仍是 200）。
2. **站内入口同一标签页打开**：首页的 `Luhn` 现在是 `<router-link>`，不再 `target="_blank"`；`Gitea` / `SpeedTest` / `Probe` 仍是新窗口外链。
3. **404 页重做**：原来是带卡通蚂蚁动画的静态跳转页，现改为与站点风格一致的 404 视图，能回显请求路径、可取消自动跳转；`public/404.html` 同步换成同风格的静态版本。
4. **粒子波浪、乱码动画、Luhn 算法与全部视觉细节未改动**，只是换成了组件生命周期管理（切页时会 `dispose()` WebGL 上下文、清理定时器）。

## 安全防护说明

`src/security/guard.js` 是纯浏览器侧检测：每分钟请求数（按路由导航计）、UA 关键词、来源关键词、连点频率。命中后写入 `localStorage` 冷却标记并跳转 `/relay`；`/relay` 在路由 `meta.public` 与 `whitelistPaths` 中都被放行，避免跳转死循环。

它只能挡住最低级的扫描器，**不能替代服务端防护**：请求在进入浏览器前就已经到达源站。真正的限流与拦截应在 Cloudflare（WAF / Rate limiting 规则）或反代层完成。

## License

MIT
