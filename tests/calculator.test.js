'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateProgress, validateProgressInput, LIMITS, ERROR_CODES } = require('../src/calculator.js');

function calc(assignedCourses, completedCourses, averageDurationMinutes) {
  return calculateProgress({ assignedCourses, completedCourses, averageDurationMinutes });
}

function expectOk(outcome) {
  assert.equal(outcome.ok, true, JSON.stringify(outcome.errors));
  return outcome.result;
}

function expectErrors(outcome) {
  assert.equal(outcome.ok, false, 'expected validation errors');
  return outcome.errors;
}

test.describe('US-01 normal calculation', () => {
  test('10 assigned, 4 completed, 30 min', () => {
    assert.deepEqual(expectOk(calc('10', '4', '30')), {
      completionPercent: 40, remainingCourses: 6, remainingMinutes: 180
    });
  });

  test('3 assigned, 1 completed, 45 min', () => {
    const r = expectOk(calc('3', '1', '45'));
    assert.ok(Math.abs(r.completionPercent - 33.333333) < 1e-5);
    assert.equal(r.remainingCourses, 2);
    assert.equal(r.remainingMinutes, 90);
  });

  test('surrounding whitespace is trimmed', () => {
    assert.deepEqual(expectOk(calc(' 10 ', '\t4', '30 ')), expectOk(calc('10', '4', '30')));
  });

  test('leading zeros are accepted', () => {
    assert.equal(expectOk(calc('010', '04', '030')).remainingCourses, 6);
  });

  test('percent has no floating-point artefacts', () => {
    assert.equal(expectOk(calc('100', '7', '1')).completionPercent, 7);
  });
});

test.describe('US-02/03/04 boundaries', () => {
  test('all completed', () => {
    assert.deepEqual(expectOk(calc('5', '5', '60')), {
      completionPercent: 100, remainingCourses: 0, remainingMinutes: 0
    });
  });

  test('none completed', () => {
    assert.deepEqual(expectOk(calc('8', '0', '15')), {
      completionPercent: 0, remainingCourses: 8, remainingMinutes: 120
    });
  });

  test('no courses assigned gives null (N/A) completion', () => {
    assert.deepEqual(expectOk(calc('0', '0', '30')), {
      completionPercent: null, remainingCourses: 0, remainingMinutes: 0
    });
  });

  test('0 assigned with 1 completed is rejected', () => {
    assert.equal(expectErrors(calc('0', '1', '30')).completedCourses.code, ERROR_CODES.EXCEEDS_ASSIGNED);
  });
});

test.describe('US-05/06 large inputs', () => {
  test('maximum values', () => {
    assert.deepEqual(expectOk(calc('1000000', '250000', '100000')), {
      completionPercent: 25, remainingCourses: 750000, remainingMinutes: 75000000000
    });
  });

  test('tiny and near-complete percentages', () => {
    assert.equal(expectOk(calc('1000000', '1', '1')).completionPercent, 0.0001);
    assert.equal(expectOk(calc('1000000', '999999', '1')).completionPercent, 99.9999);
  });

  test('counts above the limit are rejected', () => {
    const errors = expectErrors(calc(String(LIMITS.MAX_COURSES + 1), '1000001', '1'));
    assert.equal(errors.assignedCourses.code, ERROR_CODES.TOO_LARGE);
    assert.match(errors.assignedCourses.message, /no more than 1,000,000/);
    assert.equal(errors.completedCourses.code, ERROR_CODES.TOO_LARGE);
  });

  test('duration above the limit is rejected; at the limit is accepted', () => {
    const errors = expectErrors(calc('1', '0', '100001'));
    assert.equal(errors.averageDurationMinutes.code, ERROR_CODES.TOO_LARGE);
    assert.match(errors.averageDurationMinutes.message, /no more than 100,000 minutes/);
    expectOk(calc('1', '0', '100000'));
  });

  test('extremely long digit strings are rejected, not mis-parsed', () => {
    assert.equal(expectErrors(calc('9'.repeat(400), '0', '1')).assignedCourses.code, ERROR_CODES.TOO_LARGE);
  });
});

test.describe('US-07 small and fractional durations', () => {
  test('fractional duration', () => {
    assert.equal(expectOk(calc('3', '0', '7.5')).remainingMinutes, 22.5);
  });

  test('very small durations are accepted', () => {
    assert.equal(expectOk(calc('1', '0', '0.01')).remainingMinutes, 0.01);
    assert.equal(expectOk(calc('1', '0', '.5')).remainingMinutes, 0.5);
  });

  test('smallest non-zero course counts', () => {
    assert.deepEqual(expectOk(calc('1', '0', '1')), {
      completionPercent: 0, remainingCourses: 1, remainingMinutes: 1
    });
  });
});

test.describe('US-08 missing input', () => {
  for (const blank of ['', '   ', undefined, null]) {
    test(`blank value ${JSON.stringify(blank)} is required in every field`, () => {
      const errors = expectErrors(calc(blank, blank, blank));
      assert.equal(errors.assignedCourses.code, ERROR_CODES.REQUIRED);
      assert.equal(errors.completedCourses.code, ERROR_CODES.REQUIRED);
      assert.equal(errors.averageDurationMinutes.code, ERROR_CODES.REQUIRED);
      assert.equal(errors.assignedCourses.message, 'Enter the number of assigned courses.');
    });
  }

  test('missing input object is handled', () => {
    assert.equal(calculateProgress(undefined).ok, false);
    assert.equal(calculateProgress({}).ok, false);
  });
});

test.describe('US-09 invalid course counts', () => {
  for (const bad of ['-1', '2.5', 'abc', '1e3', '+5', '1,000', '0x10', '5 5', 'Infinity', 'NaN']) {
    test(`count ${JSON.stringify(bad)} is rejected`, () => {
      const errors = expectErrors(calc(bad, bad, '30'));
      assert.equal(errors.assignedCourses.code, ERROR_CODES.NOT_WHOLE_NUMBER);
      assert.equal(errors.completedCourses.code, ERROR_CODES.NOT_WHOLE_NUMBER);
      assert.match(errors.assignedCourses.message, /whole number of 0 or more/);
    });
  }
});

test.describe('US-10 completed exceeds assigned', () => {
  test('message includes both values', () => {
    const errors = expectErrors(calc('10', '12', '30'));
    assert.deepEqual(Object.keys(errors), ['completedCourses']);
    assert.equal(errors.completedCourses.message,
      'Completed courses (12) cannot be more than assigned courses (10).');
  });

  test('no comparison error when assigned is invalid', () => {
    const errors = expectErrors(calc('abc', '12', '30'));
    assert.deepEqual(Object.keys(errors), ['assignedCourses']);
  });
});

test.describe('US-11 invalid duration', () => {
  for (const bad of ['0', '0.0', '-5', 'abc', '1e2', '30min', '.', '1.2.3', 'Infinity']) {
    test(`duration ${JSON.stringify(bad)} is rejected`, () => {
      const errors = expectErrors(calc('5', '2', bad));
      assert.equal(errors.averageDurationMinutes.code, ERROR_CODES.NOT_POSITIVE_NUMBER);
      assert.match(errors.averageDurationMinutes.message, /greater than 0/);
    });
  }

  test('duration is validated even when nothing remains', () => {
    expectErrors(calc('5', '5', '0'));
  });
});

test.describe('US-12 multiple errors', () => {
  test('every invalid field is reported', () => {
    const errors = expectErrors(calc('-1', 'x', '0'));
    assert.deepEqual(Object.keys(errors).sort(),
      ['assignedCourses', 'averageDurationMinutes', 'completedCourses']);
  });
});

test.describe('US-17 programmatic API', () => {
  test('accepts numbers', () => {
    assert.deepEqual(calculateProgress({ assignedCourses: 10, completedCourses: 4, averageDurationMinutes: 30 }), {
      ok: true, result: { completionPercent: 40, remainingCourses: 6, remainingMinutes: 180 }
    });
  });

  test('rejects invalid numbers and non-string types without throwing', () => {
    const errors = expectErrors(calculateProgress({
      assignedCourses: 2.5, completedCourses: -1, averageDurationMinutes: Number.NaN
    }));
    assert.equal(errors.assignedCourses.code, ERROR_CODES.NOT_WHOLE_NUMBER);
    assert.equal(errors.completedCourses.code, ERROR_CODES.NOT_WHOLE_NUMBER);
    assert.equal(errors.averageDurationMinutes.code, ERROR_CODES.NOT_POSITIVE_NUMBER);

    for (const weird of [true, {}, [], Infinity]) {
      assert.equal(calc(weird, weird, weird).ok, false);
    }
  });

  test('validateProgressInput returns parsed values', () => {
    assert.deepEqual(validateProgressInput({ assignedCourses: '7', completedCourses: '3', averageDurationMinutes: '2.5' }), {
      valid: true, values: { assignedCourses: 7, completedCourses: 3, averageDurationMinutes: 2.5 }
    });
  });

  test('constants are frozen', () => {
    assert.ok(Object.isFrozen(LIMITS));
    assert.ok(Object.isFrozen(ERROR_CODES));
  });
});
