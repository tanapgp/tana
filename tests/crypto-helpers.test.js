const test = require('node:test');
const assert = require('node:assert/strict');
const helpers = require('../lib/crypto-helpers.js');

test('crypto helper utilities should chunk strings predictably', () => {
  assert.deepStrictEqual(helpers.chunkString('abcdefghij', 3), ['abc', 'def', 'ghi', 'j']);
});

test('crypto helper utilities should parse JSON safely', () => {
  assert.deepStrictEqual(helpers.parseJson('[1,2,3]'), [1, 2, 3]);
  assert.equal(helpers.parseJson('not-json'), null);
});
