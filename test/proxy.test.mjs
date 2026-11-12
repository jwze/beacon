/**
 * 反代路径配置的「一致性」测试
 *
 * 目标：在 src/config/external.js 里加一条，若忘了 npm run proxy:sync，
 * 这里会直接失败，而不是等到线上某个路径被 SPA 的 404 吞掉才发现。
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { EXTERNAL_PATHS, matchExternalPath } from '../src/config/external.js';
import { SITE_CONFIG } from '../src/config/site.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('matchExternalPath 按路径段匹配，不会误伤同前缀的其它路径', () => {
  assert.equal(matchExternalPath('/gitea')?.prefix, '/gitea');
  assert.equal(matchExternalPath('/gitea/user/repo')?.prefix, '/gitea');
  assert.equal(matchExternalPath('/giteax'), null);
  assert.equal(matchExternalPath('/luhn'), null);
  assert.equal(matchExternalPath('/'), null);
  assert.equal(matchExternalPath(''), null);
});

test('nginx 的 location 覆盖全部反代路径', () => {
  const conf = read('deploy/nginx/beacon-locations.conf');

  EXTERNAL_PATHS.forEach(({ prefix }) => {
    assert.ok(conf.includes(`location ^~ ${prefix}/`), `beacon-locations.conf 缺少 ${prefix} 的 location`);
    assert.ok(conf.includes(`location = ${prefix} `), `beacon-locations.conf 缺少 ${prefix} 的精确匹配`);
  });
});

test('nginx 的 upstream 与配置一致', () => {
  const conf = read('deploy/nginx/beacon-upstreams.conf');

  EXTERNAL_PATHS.forEach(({ upstream }) => {
    assert.ok(conf.includes(`server ${upstream};`), `beacon-upstreams.conf 缺少上游 ${upstream}`);
  });
});

test('_redirects 里反代规则排在通配之前', () => {
  const conf = read('public/_redirects');
  const catchAllIndex = conf.indexOf('/*  /index.html  200');

  assert.ok(catchAllIndex > 0, '_redirects 缺少 SPA 回退规则');

  EXTERNAL_PATHS.forEach(({ prefix }) => {
    const index = conf.indexOf(`${prefix}/*`);
    assert.ok(index > 0 && index < catchAllIndex, `${prefix} 的规则必须在 /* 通配之前`);
  });
});

test('首页按钮包含全部反代路径', () => {
  const urls = SITE_CONFIG.nav.filter((item) => item.url).map((item) => item.url);

  EXTERNAL_PATHS.forEach(({ prefix }) => {
    assert.ok(urls.includes(prefix), `首页缺少 ${prefix} 入口按钮`);
  });
});
