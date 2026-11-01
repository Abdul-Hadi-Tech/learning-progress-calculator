# 2. Jobs To Be Done

Jobs are written in the form *"When [situation], I want to [motivation], so I
can [expected outcome]."* Each job references a role from
[`01-app-roles.md`](01-app-roles.md). User stories in
[`03-user-stories.md`](03-user-stories.md) reference these job IDs.

| ID | Role | Job statement |
|----|------|---------------|
| J1 | R1 Learner | When I am partway through my assigned training, I want to **see what percentage I have completed**, so I can judge how far along I am. |
| J2 | R1 Learner | When I plan my study time, I want to **know how many courses remain and roughly how long they will take**, so I can schedule the remaining effort. |
| J3 | R1 Learner | When I make a typing mistake or enter impossible numbers, I want to **be told exactly what is wrong and how to fix it**, so I can trust the result I eventually see. |
| J4 | R1 Learner | When I have corrected a mistake or want to try different numbers, I want to **recover or start over quickly**, so I can continue without reloading the page. |
| J5 | R1 Learner | When I use the calculator on any device or with assistive technology, I want to **operate it comfortably**, so I can check my progress wherever I am. |
| J6 | R2 Maintainer, R3 LMS Integration | When I change or integrate the calculator, I want to **use and test the calculation logic independently of the UI**, so I can extend it (e.g. LMS integration) without regressions or extra infrastructure. |

## Success measures

| Job | The job is done well when… |
|-----|----------------------------|
| J1 | The percentage is correct, never misleading (e.g. never shows 100 % when work remains, or 0 % when no courses exist – shows **N/A** instead). |
| J2 | Remaining courses and time are correct and readable for small and very large values. |
| J3 | Every invalid input produces a specific, field-level message; no result is shown for invalid input. |
| J4 | Fixing an input clears its error; Reset returns the app to its initial state. |
| J5 | The layout works from ~320 px wide upward; all controls are keyboard-operable and labelled; results and errors are announced. |
| J6 | The logic module has no DOM dependency, runs in Node and in the browser, and is covered by automated tests. |
