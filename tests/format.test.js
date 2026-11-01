'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { formatPercent, formatCount, formatDuration } = require('../src/format.js');

test.describe('formatPercent', () => {
  const cases = [
    [null, 'N/A'],
    [undefined, 'N/A'],
    [0, '0%'],
    [100, '100%'],
    [40, '40%'],
    [100 / 3, '33.3%'],
    [200 / 3, '66.7%'],
    [0.0001, '<0.1%'],
    [0.1, '0.1%'],
    [0.05, '0.1%'],
    [0.0499, '<0.1%'],
    [99.9, '99.9%'],
    [99.9999, '>99.9%'],
    [99.94, '99.9%'],
    [99.95, '>99.9%'],
    [12.5, '12.5%']
  ];
  for (const [input, expected] of cases) {
    test(`${input} -> ${expected}`, () => assert.equal(formatPercent(input), expected));
  }
});

test.describe('formatCount', () => {
  test('uses thousands separators', () => {
    assert.equal(formatCount(0), '0');
    assert.equal(formatCount(999), '999');
    assert.equal(formatCount(750000), '750,000');
    assert.equal(formatCount(1000000), '1,000,000');
  });
});

test.describe('formatDuration', () => {
  const cases = [
    [0, '0 min'],
    [0.01, 'Less than 1 min'],
    [0.49, 'Less than 1 min'],
    [0.5, '1 min'],
    [1, '1 min'],
    [22.5, '23 min'],
    [59, '59 min'],
    [59.6, '1 h (60 min)'],
    [60, '1 h (60 min)'],
    [65, '1 h 5 min (65 min)'],
    [90, '1 h 30 min (90 min)'],
    [180, '3 h (180 min)'],
    [75000000000, '1,250,000,000 h (75,000,000,000 min)']
  ];
  for (const [input, expected] of cases) {
    test(`${input} -> ${expected}`, () => assert.equal(formatDuration(input), expected));
  }
});
