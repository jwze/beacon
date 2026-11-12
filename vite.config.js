import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const resolvePath = (path) => fileURLToPath(new URL(path, import.meta.url));

// 单页面应用（SPA）：唯一入口是项目根目录的 index.html，
// 页面由 vue-router 接管，源码按路由懒加载。
// 未匹配路径的处理见 src/router/routes.js（catch-all 路由）与 public/_redirects（静态托管回退）。
export default defineConfig({
  plugins: [vue()],
  appType: 'spa',
  base: '/',
  resolve: {
    alias: {
      '@': resolvePath('./src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: resolvePath('./dist'),
    emptyOutDir: true,
    target: 'es2019',
    // CSS 按异步路由切分，未访问的页面样式不会进入首屏
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
