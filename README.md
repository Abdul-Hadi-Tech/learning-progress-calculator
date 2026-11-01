# Learning Progress Calculator

A small, dependency-free web app for LMS learners. You enter your **assigned
courses**, **completed courses** and **average course duration (minutes)**, and
it shows:

- **Completion percentage** (or **N/A** when no courses are assigned)
- **Remaining courses**
- **Estimated remaining learning time** (hours and minutes)

It runs entirely in the browser. There is no backend, database, external API,
build step or npm dependency.

## Target user

The primary user is a **learner** on a Learning Management System who wants to
know how far along their assigned training is and how much study time is left.
The secondary user is the **developer** who maintains the calculator and will
later connect it to an LMS. See [`docs/01-app-roles.md`](docs/01-app-roles.md).

## Product documents

Written before implementation, in this order:

1. [App Roles](docs/01-app-roles.md)
2. [Jobs To Be Done](docs/02-jobs-to-be-done.md)
3. [User Stories](docs/03-user-stories.md): Given/When/Then acceptance criteria,
   linked to roles and jobs, each marked Implemented or Not implemented
   (17 implemented, 2 future stories not implemented).

## Prerequisites

| To… | You need |
|-----|----------|
| Run the app | Any modern browser (Chrome, Edge, Firefox, Safari; versions from 2020 or later). |
| Run the tests | [Node.js](https://nodejs.org/) **18 or newer** (uses the built-in `node:test` runner; developed and tested with Node 22.23.4). No `npm install` is needed. |

## Run locally

Clone or download the repository, then open `index.html` in your browser.
For example, from the repository root:

```bash
open index.html        # macOS
```

```bash
xdg-open index.html    # Linux
```

```bash
start index.html       # Windows (Command Prompt)
```

You can also double-click `index.html` in your file manager. The app works from
`file://`, so you don't need a web server.

## Run the tests

From the repository root:

```bash
npm test
```

Equivalent without npm:

```bash
node --test
```

Node finds and runs every `tests/*.test.js` file (90 tests: calculation and
validation, formatting, and UI behaviour).

## Project structure

```
index.html              Markup: form, error summary, results
src/calculator.js       Validation + calculation (pure, no DOM)
src/format.js           Number/percent/duration display text (pure, no DOM)
src/app.js              UI controller: reads inputs, shows errors/results, reset
src/styles.css          Responsive styling with light/dark themes
tests/calculator.test.js
tests/format.test.js
tests/app.test.js       UI tests against a minimal fake DOM built from index.html
docs/                   Product documents (roles, jobs, user stories)
package.json            Only defines `npm test`; no dependencies
```

## Architecture decisions

1. **Logic is separate from the UI.** `src/calculator.js` handles validation
   and arithmetic and returns structured data. `src/format.js` turns numbers
   into display text. `src/app.js` is the only file that touches the DOM.
2. **One API for people and integrations.** `calculateProgress(input)` accepts
   strings (from form fields) or numbers (from code). It never throws on bad
   input. It returns either
   `{ ok: true, result: { completionPercent, remainingCourses, remainingMinutes } }`
   or `{ ok: false, errors: { field: { code, message } } }` with stable error
   codes (`REQUIRED`, `NOT_WHOLE_NUMBER`, `NOT_POSITIVE_NUMBER`, `TOO_LARGE`,
   `EXCEEDS_ASSIGNED`). A future LMS adapter can call this API directly
   (user story US-17).
3. **UMD-style classic scripts instead of ES modules.** Browsers block ES module
   imports from `file://`, so each file attaches to `window` in the browser
   (`LearningProgress`, `LearningProgressFormat`, `LearningProgressApp`) and to
   `module.exports` in Node. This keeps "open `index.html`" working with no
   server or build step.
4. **Results stay unrounded; rounding happens only for display.** The
   calculator returns exact values (`completionPercent` is `null` when nothing
   is assigned), and the formatter rounds them. This keeps integrations precise.
5. **Text inputs with `inputmode` instead of `type="number"`.** Number inputs
   report an empty value for text like `abc` and accept `1e3`. With text inputs
   the validator sees exactly what the learner typed and can give a specific
   message. Mobile devices still show a numeric keypad.
6. **Tests use Node's built-in runner and a small fake DOM**, so there are no
   dependencies. The UI tests build their fake elements from the ids in the
   real `index.html`, so they fail if the markup and controller drift apart.
7. **Accessibility is built in.** Every input has a visible label and hint.
   Errors are linked with `aria-describedby` and `aria-invalid`. The error
   summary uses `role="alert"`, results are in a polite live region, focus
   moves to the first invalid field, and focus outlines are visible.

## Assumptions

- **Whole-number counts only.** Counts use digits only, after trimming spaces.
  Leading zeros are allowed (`010` is 10). The app rejects signs, decimals,
  exponents (`1e3`) and thousands separators (`1,000`).
- **Duration can be a decimal** such as `7.5` or `.5`. It must be greater than 0.
- **Upper limits:** 1,000,000 courses and 100,000 minutes (about 69 days) per
  course. These limits keep results readable and far inside JavaScript's safe
  integer range. They are constants in `LIMITS` in `src/calculator.js`.
- **Duration is validated even when no courses remain**, so the rules are the
  same in every case.
- **Rounding rules:**
  - Completion shows at most one decimal place. Instead of a misleading `0%`
    or `100%`, it shows `<0.1%` or `>99.9%`.
  - Remaining time is rounded to the nearest minute. Values under half a
    minute show `Less than 1 min`.
- **Display locale is fixed to en-US** (for example `1,000` and `1.5`), so
  output is the same on every machine.
- **Calculation runs on Calculate (or Enter), not on every keystroke.** Editing
  a field that has an error clears that error right away. Results are hidden
  whenever the input is invalid, so old results are never shown.

## Limitations

- **No LMS integration.** Counts are entered manually (US-18, not
  implemented).
- **Inputs are not saved** between visits (US-19, not implemented).
- **One average duration for all courses.** The estimate cannot reflect
  courses of very different lengths.
- **English only**, with no localisation of text or number formats.
- **UI tests use a fake DOM, not a real browser.** They check behaviour and
  ARIA wiring but not CSS layout. Responsive layout (320 px and 1280 px,
  including no horizontal scroll) and keyboard flow were checked once in
  headless Chromium during development. That check is not an automated test
  in this repository.

## AI tool and model

- **Tool:** Claude Code (Anthropic), run as a cloud session.
- **Model:** a Claude model from Anthropic. The exact model identifier is not
  written here because the tool's repository policy keeps model identifiers
  out of committed files. Take it from the preserved session record.
- The AI generated all product documents, code, tests and this README in that
  session. The original session transcript is preserved separately and is not
  reproduced or edited here.

## Manual code edits

**None.** No human edited any code or documentation during the AI session.
If you edit files by hand later, list each change here: the file, what changed,
and why.
