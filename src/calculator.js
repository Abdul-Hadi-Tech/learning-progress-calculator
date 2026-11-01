/**
 * Learning Progress Calculator – core logic.
 *
 * Pure validation and calculation with no DOM access, so it can be unit-tested
 * in Node.js and reused by a future LMS integration. Loaded as a classic
 * <script> in the browser (exposes `window.LearningProgress`) or via
 * `require()` in Node.js.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LearningProgress = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Upper bounds that keep results readable and well within safe integer range. */
  var LIMITS = Object.freeze({
    MAX_COURSES: 1000000,
    MAX_DURATION_MINUTES: 100000
  });

  /** Stable error codes for programmatic callers (e.g. an LMS adapter). */
  var ERROR_CODES = Object.freeze({
    REQUIRED: 'REQUIRED',
    NOT_WHOLE_NUMBER: 'NOT_WHOLE_NUMBER',
    NOT_POSITIVE_NUMBER: 'NOT_POSITIVE_NUMBER',
    TOO_LARGE: 'TOO_LARGE',
    EXCEEDS_ASSIGNED: 'EXCEEDS_ASSIGNED'
  });

  var WHOLE_NUMBER_PATTERN = /^\d+$/;
  var DECIMAL_NUMBER_PATTERN = /^(\d+(\.\d*)?|\.\d+)$/;

  function formatLimit(n) {
    return n.toLocaleString('en-US');
  }

  function error(code, message) {
    return { error: { code: code, message: message } };
  }

  function isBlank(raw) {
    return raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');
  }

  /**
   * Converts raw input (string from a form field, or number from code) into a
   * number if it matches `pattern`. Returns NaN when the format is invalid.
   */
  function toNumber(raw, pattern, isValidNumber) {
    if (typeof raw === 'number') {
      return isValidNumber(raw) ? raw : NaN;
    }
    if (typeof raw === 'string') {
      var trimmed = raw.trim();
      return pattern.test(trimmed) ? Number(trimmed) : NaN;
    }
    return NaN;
  }

  function parseCount(raw, label, requiredMessage) {
    if (isBlank(raw)) {
      return error(ERROR_CODES.REQUIRED, requiredMessage);
    }
    var value = toNumber(raw, WHOLE_NUMBER_PATTERN, function (n) {
      return Number.isInteger(n) && n >= 0;
    });
    if (Number.isNaN(value)) {
      return error(
        ERROR_CODES.NOT_WHOLE_NUMBER,
        label + ' must be a whole number of 0 or more (for example 12).'
      );
    }
    if (value > LIMITS.MAX_COURSES) {
      return error(
        ERROR_CODES.TOO_LARGE,
        label + ' must be no more than ' + formatLimit(LIMITS.MAX_COURSES) + '.'
      );
    }
    return { value: value };
  }

  function parseDuration(raw) {
    if (isBlank(raw)) {
      return error(ERROR_CODES.REQUIRED, 'Enter the average course duration in minutes.');
    }
    var value = toNumber(raw, DECIMAL_NUMBER_PATTERN, Number.isFinite);
    if (Number.isNaN(value) || value <= 0) {
      return error(
        ERROR_CODES.NOT_POSITIVE_NUMBER,
        'Average duration must be a number greater than 0 (for example 45 or 7.5).'
      );
    }
    if (value > LIMITS.MAX_DURATION_MINUTES) {
      return error(
        ERROR_CODES.TOO_LARGE,
        'Average duration must be no more than ' +
          formatLimit(LIMITS.MAX_DURATION_MINUTES) + ' minutes.'
      );
    }
    return { value: value };
  }

  /**
   * Validates raw input.
   *
   * @param {{assignedCourses?: string|number, completedCourses?: string|number,
   *          averageDurationMinutes?: string|number}} input
   * @returns {{valid: true, values: {assignedCourses: number, completedCourses: number,
   *            averageDurationMinutes: number}}
   *         | {valid: false, errors: Object<string, {code: string, message: string}>}}
   */
  function validateProgressInput(input) {
    var source = input || {};
    var assigned = parseCount(
      source.assignedCourses, 'Assigned courses', 'Enter the number of assigned courses.'
    );
    var completed = parseCount(
      source.completedCourses, 'Completed courses', 'Enter the number of completed courses.'
    );
    var duration = parseDuration(source.averageDurationMinutes);

    var errors = {};
    if (assigned.error) errors.assignedCourses = assigned.error;
    if (completed.error) errors.completedCourses = completed.error;
    if (duration.error) errors.averageDurationMinutes = duration.error;

    // Only compare the counts when both are individually valid; otherwise the
    // comparison message would be misleading.
    if (!assigned.error && !completed.error && completed.value > assigned.value) {
      errors.completedCourses = {
        code: ERROR_CODES.EXCEEDS_ASSIGNED,
        message:
          'Completed courses (' + formatLimit(completed.value) +
          ') cannot be more than assigned courses (' + formatLimit(assigned.value) + ').'
      };
    }

    if (Object.keys(errors).length > 0) {
      return { valid: false, errors: errors };
    }
    return {
      valid: true,
      values: {
        assignedCourses: assigned.value,
        completedCourses: completed.value,
        averageDurationMinutes: duration.value
      }
    };
  }

  /**
   * Validates input and calculates progress. Never throws for bad input.
   *
   * @returns {{ok: true, result: {completionPercent: number|null,
   *            remainingCourses: number, remainingMinutes: number}}
   *         | {ok: false, errors: Object<string, {code: string, message: string}>}}
   *   `completionPercent` is unrounded and is `null` when no courses are assigned.
   */
  function calculateProgress(input) {
    var validation = validateProgressInput(input);
    if (!validation.valid) {
      return { ok: false, errors: validation.errors };
    }
    var v = validation.values;
    var remainingCourses = v.assignedCourses - v.completedCourses;
    return {
      ok: true,
      result: {
        // Multiply before dividing to avoid float artefacts (7 / 100 * 100 = 7.000000000000001).
        completionPercent:
          v.assignedCourses === 0 ? null : (v.completedCourses * 100) / v.assignedCourses,
        remainingCourses: remainingCourses,
        remainingMinutes: remainingCourses * v.averageDurationMinutes
      }
    };
  }

  return {
    LIMITS: LIMITS,
    ERROR_CODES: ERROR_CODES,
    validateProgressInput: validateProgressInput,
    calculateProgress: calculateProgress
  };
});
