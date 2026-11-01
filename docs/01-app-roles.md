# 1. App Roles

This document lists who interacts with the Learning Progress Calculator. It is
the first product document; the Jobs To Be Done (`02-jobs-to-be-done.md`) and
User Stories (`03-user-stories.md`) refer to the role IDs below.

The application runs entirely in the browser with no accounts, so roles are
defined by *intent*, not by login or permissions.

| ID | Role | Description | Primary goals | In scope now? |
|----|------|-------------|---------------|---------------|
| R1 | **Learner** | A person enrolled in training on an LMS who wants to understand how far along they are and how much effort remains. | See completion %, remaining courses and remaining time; get clear guidance when input is wrong. | **Yes – primary user** |
| R2 | **Maintainer / Developer** | The engineer who maintains the calculator and will later connect it to an LMS. | Test calculation logic in isolation; reuse it without the UI; change it safely. | **Yes – secondary user** |
| R3 | **LMS Integration (system)** | A future automated caller (e.g. an LMS plugin or API adapter) that supplies course counts programmatically instead of a human typing them. | Call a stable, UI-independent function with numeric input and receive structured results or structured errors. | **Partially** – the logic API is ready; no actual integration is built. |

## Out-of-scope roles

| Role | Why excluded |
|------|--------------|
| Instructor / Manager viewing many learners | Requires stored data and a backend, which is explicitly out of scope. |
| Administrator configuring courses | No configuration or persistence exists. |

## Role assumptions

- The Learner already knows their assigned and completed course counts (e.g.
  read from their LMS dashboard) and an approximate average course duration.
- The Learner may use a phone, tablet or desktop browser, and may use a
  keyboard or screen reader.
- The Maintainer has Node.js available for running tests; the Learner needs
  only a browser.
