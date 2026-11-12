import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // 多页面（MPA）：首页 / Luhn / relay / 404 各自独立入口
  appType: 'mpa',
  base: '/',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2019',
    rollupOptions: {
      input: {
        index: resolvePath('./index.html'),
        luhn: resolvePath('./luhn.html'),
        relay: resolvePath('./relay.html'),
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
