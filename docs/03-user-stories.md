# 3. User Stories

Each story links to a role ([`01-app-roles.md`](01-app-roles.md)) and a job
([`02-jobs-to-be-done.md`](02-jobs-to-be-done.md)), has Given/When/Then
acceptance criteria, and is marked **Implemented** or **Not implemented**.

"Test" lists the automated tests covering the story (in `tests/`). Stories
about on-screen behaviour are covered by the UI tests in `tests/app.test.js`,
which drive `src/app.js` against a minimal fake DOM built from the element ids
in the real `index.html` (see README → Architecture).

## Shared rules (referenced by the stories)

| Rule | Definition |
|------|------------|
| **Count format** | Assigned and completed courses: digits only after trimming surrounding spaces (`0`, `12`, ` 7 `). Rejected: empty, negative, decimals, `1e3`, `+5`, letters, thousands separators. |
| **Count limit** | Each count must be ≤ **1,000,000**. |
| **Duration format** | Average course duration in minutes: a decimal number after trimming (`45`, `7.5`, `.5`). Must be **> 0** and ≤ **100,000**. |
| **Completion %** | `completed ÷ assigned × 100`, shown to at most 1 decimal place (`40%`, `33.3%`). A non-zero value that would round to 0 % (below 0.05) shows `<0.1%`; a value below 100 that would round to 100 % (99.95 or more) shows `>99.9%`, so the display never claims 0 % or 100 % incorrectly. **N/A** when assigned = 0. |
| **Remaining courses** | `assigned − completed`, with thousands separators. |
| **Remaining time** | `remaining courses × duration` minutes, rounded to the nearest minute and shown as hours and minutes (`3 h`, `1 h 5 min`, `45 min`), plus the total in minutes when ≥ 60 (`(180 min)`). A non-zero value under 0.5 min shows `Less than 1 min`. |

## Story index

| ID | Title | Role | Job | Category | Status |
|----|-------|------|-----|----------|--------|
| US-01 | Calculate progress from valid input | R1 | J1, J2 | Normal | Implemented |
| US-02 | All courses completed | R1 | J1, J2 | Boundary | Implemented |
| US-03 | No courses completed yet | R1 | J1, J2 | Boundary | Implemented |
| US-04 | No courses assigned shows N/A | R1 | J1, J2 | Boundary | Implemented |
| US-05 | Non-misleading percentage rounding | R1 | J1 | Boundary | Implemented |
| US-06 | Large inputs | R1 | J1, J2, J3 | Large inputs | Implemented |
| US-07 | Small and fractional durations | R1 | J2 | Small inputs | Implemented |
| US-08 | Missing input | R1 | J3 | Invalid | Implemented |
| US-09 | Invalid course counts | R1 | J3 | Invalid | Implemented |
| US-10 | Completed exceeds assigned | R1 | J3 | Invalid | Implemented |
| US-11 | Invalid duration | R1 | J3 | Invalid / Boundary | Implemented |
| US-12 | Several errors at once | R1 | J3, J5 | Invalid | Implemented |
| US-13 | Recover after correcting input | R1 | J4 | Recovery | Implemented |
| US-14 | No stale results after invalid input | R1 | J3, J4 | Recovery | Implemented |
| US-15 | Reset the calculator | R1 | J4 | Recovery | Implemented |
| US-16 | Responsive and accessible interface | R1 | J5 | Normal | Implemented |
| US-17 | UI-independent calculation API | R2, R3 | J6 | Normal | Implemented |
| US-18 | Import counts directly from an LMS | R3 | J6 | Future | Not implemented |
| US-19 | Remember previous inputs between visits | R1 | J4 | Future | Not implemented |

---

## US-01 – Calculate progress from valid input
**Role:** R1 Learner · **Jobs:** J1, J2 · **Status:** Implemented · **Tests:** `calculator.test.js`, `app.test.js`

*As a learner, I want to enter my assigned courses, completed courses and
average duration, so that I see my completion percentage, remaining courses and
remaining learning time.*

- **Given** assigned = `10`, completed = `4`, duration = `30`
  **When** I select **Calculate**
  **Then** I see completion `40%`, remaining courses `6`, remaining time `3 h (180 min)`.
- **Given** assigned = `3`, completed = `1`, duration = `45`
  **When** I calculate
  **Then** I see `33.3%`, `2`, `1 h 30 min (90 min)`.
- **Given** values with surrounding spaces (` 10 `, ` 4 `, ` 30 `)
  **When** I calculate
  **Then** they are accepted and give the same result as without spaces.
- **Given** a count with leading zeros (`010`)
  **When** I calculate
  **Then** it is treated as `10`.

## US-02 – All courses completed
**Role:** R1 · **Jobs:** J1, J2 · **Status:** Implemented · **Tests:** `calculator.test.js`

- **Given** assigned = `5`, completed = `5`, duration = `60`
  **When** I calculate
  **Then** I see `100%`, remaining courses `0`, remaining time `0 min`.

## US-03 – No courses completed yet
**Role:** R1 · **Jobs:** J1, J2 · **Status:** Implemented · **Tests:** `calculator.test.js`

- **Given** assigned = `8`, completed = `0`, duration = `15`
  **When** I calculate
  **Then** I see `0%`, remaining courses `8`, remaining time `2 h (120 min)`.

## US-04 – No courses assigned shows N/A
**Role:** R1 · **Jobs:** J1, J2 · **Status:** Implemented · **Tests:** `calculator.test.js`, `app.test.js`

- **Given** assigned = `0`, completed = `0`, duration = `30`
  **When** I calculate
  **Then** completion shows `N/A` (not `0%`), remaining courses `0`, remaining time `0 min`,
  and a note explains that no courses are assigned.
- **Given** assigned = `0`, completed = `1`
  **When** I calculate
  **Then** the completed-exceeds-assigned error from US-10 is shown instead.

## US-05 – Non-misleading percentage rounding
**Role:** R1 · **Job:** J1 · **Status:** Implemented · **Tests:** `format.test.js`, `calculator.test.js`

- **Given** assigned = `1000000`, completed = `1`
  **When** I calculate
  **Then** completion shows `<0.1%` (not `0%`).
- **Given** assigned = `1000000`, completed = `999999`
  **When** I calculate
  **Then** completion shows `>99.9%` (not `100%`).
- **Given** assigned = `3`, completed = `2`
  **When** I calculate
  **Then** completion shows `66.7%`.

## US-06 – Large inputs
**Role:** R1 · **Jobs:** J1, J2, J3 · **Status:** Implemented · **Tests:** `calculator.test.js`, `format.test.js`

- **Given** assigned = `1000000`, completed = `250000`, duration = `100000`
  **When** I calculate
  **Then** I see `25%`, remaining `750,000`, and remaining time
  `1,250,000,000 h (75,000,000,000 min)` with thousands separators and no overflow or scientific notation.
- **Given** assigned = `1000001`
  **When** I calculate
  **Then** I see an error that assigned courses must be no more than 1,000,000.
- **Given** duration = `100001`
  **When** I calculate
  **Then** I see an error that the duration must be no more than 100,000 minutes.

## US-07 – Small and fractional durations
**Role:** R1 · **Job:** J2 · **Status:** Implemented · **Tests:** `calculator.test.js`, `format.test.js`

- **Given** assigned = `3`, completed = `0`, duration = `7.5`
  **When** I calculate
  **Then** remaining time is `23 min` (22.5 rounded to nearest minute).
- **Given** assigned = `1`, completed = `0`, duration = `0.1`
  **When** I calculate
  **Then** remaining time shows `Less than 1 min` (not `0 min`).
- **Given** assigned = `1`, completed = `0`, duration = `1`
  **When** I calculate
  **Then** I see `0%`, `1`, `1 min`.

## US-08 – Missing input
**Role:** R1 · **Job:** J3 · **Status:** Implemented · **Tests:** `calculator.test.js`, `app.test.js`

- **Given** any field is empty or contains only spaces
  **When** I calculate
  **Then** that field shows a "required" message naming the field (e.g. "Enter the number of assigned courses.")
  and no result is shown.

## US-09 – Invalid course counts
**Role:** R1 · **Job:** J3 · **Status:** Implemented · **Tests:** `calculator.test.js`

- **Given** assigned or completed is `-1`, `2.5`, `abc`, `1e3`, `+5` or `1,000`
  **When** I calculate
  **Then** that field shows "… must be a whole number of 0 or more" and no result is shown.

## US-10 – Completed exceeds assigned
**Role:** R1 · **Job:** J3 · **Status:** Implemented · **Tests:** `calculator.test.js`, `app.test.js`

- **Given** assigned = `10`, completed = `12`
  **When** I calculate
  **Then** the completed field shows "Completed courses (12) cannot be more than assigned courses (10)." and no result is shown.
- **Given** assigned is itself invalid (e.g. `abc`) and completed = `12`
  **When** I calculate
  **Then** only the assigned-courses format error is shown for that comparison (no misleading comparison error).

## US-11 – Invalid duration
**Role:** R1 · **Job:** J3 · **Status:** Implemented · **Tests:** `calculator.test.js`

- **Given** duration = `0`, `0.0`, `-5`, `abc`, `1e2` or `30min`
  **When** I calculate
  **Then** the duration field shows "Average duration must be a number greater than 0 …" and no result is shown.
- **Given** duration = `0.01`
  **When** I calculate
  **Then** it is accepted (smallest positive values are valid).
- **Given** assigned = completed (nothing remains)
  **When** duration is invalid
  **Then** the duration error is still shown (the field is always validated).

## US-12 – Several errors at once
**Role:** R1 · **Jobs:** J3, J5 · **Status:** Implemented · **Tests:** `calculator.test.js`, `app.test.js`

- **Given** all three fields are invalid
  **When** I calculate
  **Then** each field shows its own message, an error summary states how many fields need attention,
  and keyboard focus moves to the first invalid field.

## US-13 – Recover after correcting input
**Role:** R1 · **Job:** J4 · **Status:** Implemented · **Tests:** `app.test.js`

- **Given** a field is showing an error
  **When** I edit that field
  **Then** its error message and invalid styling are cleared immediately.
- **Given** I have corrected every invalid field
  **When** I calculate
  **Then** the error summary disappears and the correct results are shown.

## US-14 – No stale results after invalid input
**Role:** R1 · **Jobs:** J3, J4 · **Status:** Implemented · **Tests:** `app.test.js`

- **Given** results are showing from a previous valid calculation
  **When** I change an input to an invalid value and calculate
  **Then** the previous results are hidden and only errors are shown.

## US-15 – Reset the calculator
**Role:** R1 · **Job:** J4 · **Status:** Implemented · **Tests:** `app.test.js`

- **Given** any combination of entered values, errors and results
  **When** I select **Reset**
  **Then** all fields are empty, all errors and results are removed, and focus returns to the first field.

## US-16 – Responsive and accessible interface
**Role:** R1 · **Job:** J5 · **Status:** Implemented · **Tests:** `app.test.js` (ARIA wiring); layout checked manually in a browser at 320 px and 1280 px.

- **Given** a viewport 320 px wide
  **When** I open the app
  **Then** all fields, buttons and results are usable without horizontal scrolling.
- **Given** I use only a keyboard
  **When** I tab through the form
  **Then** every control is reachable in a logical order, has a visible focus indicator, and Enter submits the form.
- **Given** I use a screen reader
  **When** an error or result appears
  **Then** each input has a visible label and hint, invalid inputs have `aria-invalid="true"` and are linked to
  their message via `aria-describedby`, and results/error summary are in live regions.

## US-17 – UI-independent calculation API
**Roles:** R2 Maintainer, R3 LMS Integration · **Job:** J6 · **Status:** Implemented · **Tests:** `calculator.test.js`

- **Given** the module `src/calculator.js`
  **When** it is loaded in Node.js (`require`) or in the browser (`window.LearningProgress`)
  **Then** it works without any DOM.
- **Given** an integration passes numbers (e.g. `{ assignedCourses: 10, completedCourses: 4, averageDurationMinutes: 30 }`)
  **When** it calls `calculateProgress`
  **Then** it receives `{ ok: true, result: { completionPercent: 40, remainingCourses: 6, remainingMinutes: 180 } }`.
- **Given** invalid input
  **When** it calls `calculateProgress`
  **Then** it receives `{ ok: false, errors: { <field>: { code, message } } }` with stable error codes and never throws.

## US-18 – Import counts directly from an LMS
**Role:** R3 · **Job:** J6 · **Status:** Not implemented

- **Given** a learner is signed into an LMS
  **When** the calculator opens
  **Then** assigned and completed counts are pre-filled from the LMS.

*Not implemented: requires an external API, which is out of scope. The
`calculateProgress` API (US-17) is the intended extension point.*

## US-19 – Remember previous inputs between visits
**Role:** R1 · **Job:** J4 · **Status:** Not implemented

- **Given** I calculated progress earlier
  **When** I reopen the app
  **Then** my last inputs are pre-filled.

*Not implemented: not requested; avoids storing data in the browser.*
