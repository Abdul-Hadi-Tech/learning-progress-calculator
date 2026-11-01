/**
 * Learning Progress Calculator – UI controller.
 *
 * Wires the form in index.html to the pure logic in calculator.js and
 * format.js. All calculation and validation rules live in calculator.js; this
 * file only reads inputs, shows errors/results, and handles reset/recovery.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./calculator.js'), require('./format.js'));
  } else {
    root.LearningProgressApp = factory(root.LearningProgress, root.LearningProgressFormat);
  }
})(typeof self !== 'undefined' ? self : this, function (calculator, format) {
  'use strict';

  /** Maps calculator field names to their DOM element ids. */
  var FIELD_IDS = {
    assignedCourses: 'assigned-courses',
    completedCourses: 'completed-courses',
    averageDurationMinutes: 'average-duration'
  };
  var FIELD_ORDER = ['assignedCourses', 'completedCourses', 'averageDurationMinutes'];

  function getRequired(doc, id) {
    var el = doc.getElementById(id);
    if (!el) throw new Error('Learning Progress Calculator: missing element #' + id);
    return el;
  }

  /**
   * Attaches behaviour to the calculator markup inside `doc`.
   * @param {Document} doc
   * @returns {{calculate: function(): void, reset: function(): void}}
   */
  function initApp(doc) {
    var form = getRequired(doc, 'progress-form');
    var summary = getRequired(doc, 'error-summary');
    var results = getRequired(doc, 'results');
    var out = {
      completion: getRequired(doc, 'result-completion'),
      remainingCourses: getRequired(doc, 'result-remaining-courses'),
      remainingTime: getRequired(doc, 'result-remaining-time'),
      progressTrack: getRequired(doc, 'result-progress-track'),
      progressBar: getRequired(doc, 'result-progress-bar'),
      note: getRequired(doc, 'result-note')
    };
    var fields = {};
    FIELD_ORDER.forEach(function (name) {
      fields[name] = {
        input: getRequired(doc, FIELD_IDS[name]),
        error: getRequired(doc, FIELD_IDS[name] + '-error')
      };
    });

    function setFieldError(name, message) {
      var f = fields[name];
      f.input.setAttribute('aria-invalid', 'true');
      f.error.textContent = message;
      f.error.hidden = false;
    }

    function clearFieldError(name) {
      var f = fields[name];
      f.input.removeAttribute('aria-invalid');
      f.error.textContent = '';
      f.error.hidden = true;
    }

    function hideSummary() {
      summary.textContent = '';
      summary.hidden = true;
    }

    function hideResults() {
      results.hidden = true;
      out.note.hidden = true;
      out.note.textContent = '';
    }

    function showErrors(errors) {
      hideResults();
      var invalid = FIELD_ORDER.filter(function (name) { return errors[name]; });
      FIELD_ORDER.forEach(function (name) {
        if (errors[name]) setFieldError(name, errors[name].message);
        else clearFieldError(name);
      });
      summary.textContent = invalid.length === 1
        ? 'Please fix 1 field below.'
        : 'Please fix ' + invalid.length + ' fields below.';
      summary.hidden = false;
      fields[invalid[0]].input.focus();
    }

    function showResult(result) {
      FIELD_ORDER.forEach(clearFieldError);
      hideSummary();

      out.completion.textContent = format.formatPercent(result.completionPercent);
      out.remainingCourses.textContent = format.formatCount(result.remainingCourses);
      out.remainingTime.textContent = format.formatDuration(result.remainingMinutes);

      var noCourses = result.completionPercent === null;
      out.progressTrack.hidden = noCourses;
      out.progressBar.style.width = noCourses ? '0%' : result.completionPercent + '%';

      if (noCourses) {
        out.note.textContent = 'No courses are assigned, so completion cannot be calculated.';
        out.note.hidden = false;
      } else if (result.remainingCourses === 0) {
        out.note.textContent = 'All assigned courses are complete.';
        out.note.hidden = false;
      }
      results.hidden = false;
    }

    function calculate() {
      var input = {};
      FIELD_ORDER.forEach(function (name) { input[name] = fields[name].input.value; });
      var outcome = calculator.calculateProgress(input);
      if (outcome.ok) showResult(outcome.result);
      else showErrors(outcome.errors);
    }

    function reset() {
      FIELD_ORDER.forEach(function (name) {
        fields[name].input.value = '';
        clearFieldError(name);
      });
      hideSummary();
      hideResults();
      fields[FIELD_ORDER[0]].input.focus();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      calculate();
    });
    form.addEventListener('reset', function (event) {
      event.preventDefault();
      reset();
    });
    FIELD_ORDER.forEach(function (name) {
      // Recovery: editing a field clears its error straight away.
      fields[name].input.addEventListener('input', function () {
        if (fields[name].input.getAttribute('aria-invalid') === 'true') clearFieldError(name);
      });
    });

    // Explicit initial state, independent of markup defaults.
    FIELD_ORDER.forEach(clearFieldError);
    hideSummary();
    hideResults();

    return { calculate: calculate, reset: reset };
  }

  if (typeof document !== 'undefined' && document.getElementById('progress-form')) {
    initApp(document);
  }

  return { initApp: initApp, FIELD_IDS: FIELD_IDS };
});
