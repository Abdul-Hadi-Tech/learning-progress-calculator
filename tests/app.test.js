'use strict';

/**
 * UI tests for src/app.js.
 *
 * To stay dependency-free these use a tiny fake DOM that implements only the
 * members app.js touches. Element ids are taken from the real index.html, so
 * the test fails if the markup and controller drift apart.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { initApp } = require('../src/app.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

class FakeElement {
  constructor(doc, id, tag) {
    this.ownerDocument = doc;
    this.id = id;
    this.tagName = tag;
    this.value = '';
    this.textContent = '';
    this.hidden = false;
    this.style = {};
    this.attributes = new Map();
    this.listeners = new Map();
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }
  dispatch(type) {
    const event = { type, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    (this.listeners.get(type) || []).forEach((fn) => fn(event));
    return event;
  }
  focus() { this.ownerDocument.activeElement = this; }
}

/** Builds a fake document containing one element per id in index.html. */
function createDocument() {
  const doc = { activeElement: null, elements: new Map() };
  for (const [, tag, attrs] of html.matchAll(/<([a-z0-9]+)\b([^>]*\bid="[^"]+"[^>]*)>/gi)) {
    const id = /\bid="([^"]+)"/.exec(attrs)[1];
    const el = new FakeElement(doc, id, tag.toLowerCase());
    for (const a of attrs.matchAll(/([a-z-]+)="([^"]*)"/gi)) el.setAttribute(a[1], a[2]);
    el.hidden = /\bhidden\b/.test(attrs.replace(/"[^"]*"/g, ''));
    doc.elements.set(id, el);
  }
  doc.getElementById = (id) => doc.elements.get(id) || null;
  return doc;
}

function setup() {
  const doc = createDocument();
  initApp(doc);
  const $ = (id) => doc.getElementById(id);
  const fill = (assigned, completed, duration) => {
    $('assigned-courses').value = assigned;
    $('completed-courses').value = completed;
    $('average-duration').value = duration;
  };
  const submit = () => $('progress-form').dispatch('submit');
  const type = (id, value) => { $(id).value = value; $(id).dispatch('input'); };
  return { doc, $, fill, submit, type };
}

test('markup: every input has a label, hint and error linked via aria-describedby', () => {
  for (const id of ['assigned-courses', 'completed-courses', 'average-duration']) {
    assert.match(html, new RegExp(`<label for="${id}">`));
    const { $ } = setup();
    assert.equal($(id).getAttribute('aria-describedby'), `${id}-hint ${id}-error`);
    assert.ok($(`${id}-hint`) && $(`${id}-error`));
  }
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /id="results"[^>]*aria-live="polite"/);
  assert.match(html, /id="error-summary"[^>]*role="alert"/);
});

test('initial state: no results, no errors', () => {
  const { $ } = setup();
  assert.equal($('results').hidden, true);
  assert.equal($('error-summary').hidden, true);
  assert.equal($('assigned-courses-error').hidden, true);
});

test('US-01: valid input shows results and prevents page reload', () => {
  const { $, fill, submit } = setup();
  fill('10', '4', '30');
  const event = submit();
  assert.equal(event.defaultPrevented, true);
  assert.equal($('results').hidden, false);
  assert.equal($('result-completion').textContent, '40%');
  assert.equal($('result-remaining-courses').textContent, '6');
  assert.equal($('result-remaining-time').textContent, '3 h (180 min)');
  assert.equal($('result-progress-bar').style.width, '40%');
  assert.equal($('result-note').hidden, true);
});

test('US-02: all complete shows a note', () => {
  const { $, fill, submit } = setup();
  fill('5', '5', '60');
  submit();
  assert.equal($('result-completion').textContent, '100%');
  assert.equal($('result-note').hidden, false);
  assert.match($('result-note').textContent, /complete/);
});

test('US-04: zero assigned shows N/A, hides the bar and explains why', () => {
  const { $, fill, submit } = setup();
  fill('0', '0', '30');
  submit();
  assert.equal($('result-completion').textContent, 'N/A');
  assert.equal($('result-remaining-courses').textContent, '0');
  assert.equal($('result-remaining-time').textContent, '0 min');
  assert.equal($('result-progress-track').hidden, true);
  assert.match($('result-note').textContent, /No courses are assigned/);
});

test('US-08/US-12: all-empty submit shows each field error, summary and focuses first field', () => {
  const { doc, $, submit } = setup();
  submit();
  assert.equal($('results').hidden, true);
  assert.equal($('error-summary').hidden, false);
  assert.equal($('error-summary').textContent, 'Please fix 3 fields below.');
  for (const id of ['assigned-courses', 'completed-courses', 'average-duration']) {
    assert.equal($(id).getAttribute('aria-invalid'), 'true');
    assert.equal($(`${id}-error`).hidden, false);
    assert.ok($(`${id}-error`).textContent.length > 0);
  }
  assert.equal(doc.activeElement, $('assigned-courses'));
});

test('US-10: completed > assigned focuses the completed field', () => {
  const { doc, $, fill, submit } = setup();
  fill('10', '12', '30');
  submit();
  assert.equal($('error-summary').textContent, 'Please fix 1 field below.');
  assert.equal($('completed-courses-error').textContent,
    'Completed courses (12) cannot be more than assigned courses (10).');
  assert.equal($('assigned-courses').getAttribute('aria-invalid'), null);
  assert.equal(doc.activeElement, $('completed-courses'));
});

test('US-13: editing an invalid field clears its error; correcting all fields recovers', () => {
  const { $, fill, submit, type } = setup();
  fill('abc', '2', '0');
  submit();
  assert.equal($('assigned-courses-error').hidden, false);

  type('assigned-courses', '8');
  assert.equal($('assigned-courses-error').hidden, true);
  assert.equal($('assigned-courses').getAttribute('aria-invalid'), null);
  assert.equal($('average-duration-error').hidden, false, 'other errors remain until fixed');

  type('average-duration', '15');
  submit();
  assert.equal($('error-summary').hidden, true);
  assert.equal($('average-duration-error').hidden, true);
  assert.equal($('results').hidden, false);
  assert.equal($('result-completion').textContent, '25%');
  assert.equal($('result-remaining-time').textContent, '1 h 30 min (90 min)');
});

test('US-14: invalid recalculation hides previous results', () => {
  const { $, fill, submit, type } = setup();
  fill('10', '4', '30');
  submit();
  assert.equal($('results').hidden, false);
  type('completed-courses', '-3');
  submit();
  assert.equal($('results').hidden, true);
  assert.equal($('completed-courses-error').hidden, false);
});

test('US-15: reset clears values, errors, results and focuses the first field', () => {
  const { doc, $, fill, submit } = setup();
  fill('10', '4', '30');
  submit();
  fill('10', '40', '');
  submit();
  const event = $('progress-form').dispatch('reset');
  assert.equal(event.defaultPrevented, true);
  for (const id of ['assigned-courses', 'completed-courses', 'average-duration']) {
    assert.equal($(id).value, '');
    assert.equal($(id).getAttribute('aria-invalid'), null);
    assert.equal($(`${id}-error`).hidden, true);
  }
  assert.equal($('error-summary').hidden, true);
  assert.equal($('results').hidden, true);
  assert.equal(doc.activeElement, $('assigned-courses'));
});

test('initApp fails loudly if required markup is missing', () => {
  assert.throws(() => initApp({ getElementById: () => null }), /missing element #progress-form/);
});
