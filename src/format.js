/**
 * Learning Progress Calculator – display formatting.
 *
 * Turns numeric results from calculator.js into learner-facing text. No DOM
 * access. Exposes `window.LearningProgressFormat` in the browser, or
 * `module.exports` in Node.js. Uses the en-US locale so output is identical on
 * every machine.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LearningProgressFormat = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LOCALE = 'en-US';
  var oneDecimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
  var integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

  /**
   * Formats a completion percentage to at most one decimal place. `null` →
   * "N/A". Values that would round to 0% or 100% without actually being 0 or
   * 100 show "<0.1%" / ">99.9%", so the display never overstates or hides progress.
   */
  function formatPercent(percent) {
    if (percent === null || percent === undefined) return 'N/A';
    if (percent === 0) return '0%';
    if (percent === 100) return '100%';
    if (percent < 0.05) return '<0.1%';
    if (percent >= 99.95) return '>99.9%';
    return oneDecimal.format(percent) + '%';
  }

  /** Formats a whole-number count with thousands separators. */
  function formatCount(count) {
    return integer.format(count);
  }

  /**
   * Formats minutes as "X h Y min", rounded to the nearest minute, with the
   * total in minutes appended when it is an hour or more.
   */
  function formatDuration(minutes) {
    if (minutes === 0) return '0 min';
    if (minutes < 0.5) return 'Less than 1 min';

    var total = Math.round(minutes);
    var hours = Math.floor(total / 60);
    var mins = total % 60;

    if (hours === 0) return integer.format(mins) + ' min';

    var text = integer.format(hours) + ' h';
    if (mins > 0) text += ' ' + mins + ' min';
    return text + ' (' + integer.format(total) + ' min)';
  }

  return {
    formatPercent: formatPercent,
    formatCount: formatCount,
    formatDuration: formatDuration
  };
});
