import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url));
const toPosixPath = (path) => path.replace(/\\/g, '/');

// HTML 入口统一收在 pages/，并把 Vite 的 root 指向该目录。
// 产物 HTML 因此仍落在 dist/ 根目录，线上 URL（/、/luhn.html、/relay.html）保持不变。
// root 之外的 public/、dist/、node_modules/ 与 .env 需要显式指回项目根。
export default defineConfig({
  // 多页面（MPA）：首页 / Luhn / relay / 404 各自独立入口
  appType: 'mpa',
  root: resolvePath('./pages'),
  publicDir: resolvePath('./public'),
  cacheDir: resolvePath('./node_modules/.vite'),
  envDir: resolvePath('.'),
  base: '/',
  resolve: {
    // HTML 用站点根绝对路径 /src/... 引用源码；root 在 pages/ 下时，
    // 需把该前缀指回项目根的 src/，否则 dev 与 build 都会解析到 pages/src/。
    alias: [{ find: /^\/src\//, replacement: `${toPosixPath(resolvePath('./src'))}/` }],
  },
  server: {
    port: 5173,
    open: false,
    // root 在 pages/，源码位于其上一级，需显式放行项目根
    fs: {
      allow: [resolvePath('.')],
    },
  },
  build: {
    outDir: resolvePath('./dist'),
    emptyOutDir: true,
    target: 'es2019',
    rollupOptions: {
      input: {
        index: resolvePath('./pages/index.html'),
        luhn: resolvePath('./pages/luhn.html'),
        relay: resolvePath('./pages/relay.html'),
        // 供 public/404.html 以固定路径 /assets/notfound.js 引用
        notfound: resolvePath('./src/pages/notfound.js'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
