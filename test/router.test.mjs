/**
 * 路由表回归测试
 * 重点守住两件事：
 *   1. 兜底路由存在且排在最后（否则未匹配路径不会被 404 捕获）
 *   2. 每条页面路由都带齐 meta（标题 / 布局 / 语言），否则会渲染成无标题、无样式页
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRouterMatcher } from 'vue-router';
import { routes } from '../src/router/routes.js';

const pageRoutes = routes.filter((route) => route.component);
const redirectRoutes = routes.filter((route) => route.redirect);
const matcher = createRouterMatcher(routes, { globalOptions: {} });

test('最后一条路由是 404 兜底', () => {
  const last = routes[routes.length - 1];

  assert.equal(last.name, 'not-found');
  assert.equal(last.path, '/:pathMatch(.*)*');
  assert.ok(last.component, '404 路由必须有组件');
});

test('兜底路由能捕获任意深度的未定义路径', () => {
  const samples = [
    '/unknown',
    '/a/b/c',
    '/luhn/extra',
    '/relay/deep/path',
    '/foo.html',
    '/%E4%B8%AD%E6%96%87',
  ];

  samples.forEach((sample) => {
    assert.equal(matcher.resolve({ path: sample }).name, 'not-found', `${sample} 未被 404 捕获`);
  });
});

test('已定义路径不会被兜底抢走', () => {
  assert.equal(matcher.resolve({ path: '/' }).name, 'home');
  assert.equal(matcher.resolve({ path: '/luhn' }).name, 'luhn');
  assert.equal(matcher.resolve({ path: '/relay' }).name, 'relay');
});

test('页面路由都带齐 meta', () => {
  pageRoutes.forEach((route) => {
    assert.ok(route.meta, `${route.path} 缺少 meta`);
    assert.ok(route.meta.title, `${route.path} 缺少 meta.title`);
    assert.ok(route.meta.layout, `${route.path} 缺少 meta.layout`);
    assert.ok(route.meta.lang, `${route.path} 缺少 meta.lang`);
  });
});

test('旧页面地址保留重定向', () => {
  const paths = redirectRoutes.map((route) => route.path);

  ['/index.html', '/luhn.html', '/relay.html'].forEach((legacyPath) => {
    assert.ok(paths.includes(legacyPath), `${legacyPath} 应重定向到新路由`);
  });
});

test('路由路径不重复', () => {
  const paths = routes.map((route) => route.path);
  assert.equal(new Set(paths).size, paths.length, `发现重复路径: ${paths.join(', ')}`);
});

test('relay 页标记为公开路由（跳过安全防护）', () => {
  const relay = routes.find((route) => route.name === 'relay');
  assert.equal(relay.meta.public, true);
});
