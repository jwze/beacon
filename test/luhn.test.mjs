import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCardNumbers, luhnCheck } from '../src/lib/luhn.js';

// 期望值来自重构前实现的实测输出，用于防止算法被改坏
const CASES = [
  ['622848aaabbb', 10],
  ['52**aabb', 1000],
  ['4242424242424242', 1],
  ['4111aaaa', 2],
  ['34******', 100000],
  ['378282246310005', 1],
  ['aabbccdd', 1048],
  ['x5x5x5x5x', 10000],
  ['0000000000000', 1],
  ['99999999999999', 0],
];

test('luhnCheck 校验已知卡号', () => {
  assert.equal(luhnCheck('4242424242424242'), true);
  assert.equal(luhnCheck('4242424242424241'), false);
});

test('generateCardNumbers 结果数量与重构前一致', () => {
  for (const [pattern, count] of CASES) {
    assert.equal(generateCardNumbers(pattern).length, count, `pattern=${pattern}`);
  }
});

test('生成结果均通过 Luhn 校验且长度正确', () => {
  const results = generateCardNumbers('622848aaabbb');
  for (const card of results) {
    assert.equal(card.length, 12);
    assert.equal(luhnCheck(card), true);
    assert.ok(card.startsWith('622848'));
  }
});

test('非法字符抛出错误', () => {
  assert.throws(() => generateCardNumbers('6228-48'));
});
