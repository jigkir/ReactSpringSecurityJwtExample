# Task: complete refactor, Phases 1 to 6. Edit the repository directly.

You are a senior React engineer working in this repository (React, Vite, Tailwind, react-router, react-i18next fr/en,
Vitest). Paths are relative to `src/`.

## A. How to work

**Modify the files in the repository yourself.** Create, edit, move and delete them. Do not just show code in the chat,
do not produce a zip, and do not ask me to copy and paste.

**Do all six phases, in order: 1, 2, 3, 4, 5, 6. Do not wait for my approval between steps or phases.** This overrides
the guide's "one phase per request" rule, its "wait for my OK" step and its required output of complete code in the
reply. Shared file edits that a phase needs are approved. Every other guide rule still applies.

Phases stay separate: finish, verify and commit one before starting the next.

If something is unclear or the code differs from this prompt or the guide, choose the option that keeps current
behaviour, write it in the report, and continue. If this prompt and the guide disagree, this prompt wins.

**Stop and ask only if:**

- the working tree has uncommitted changes at the start;
- a fix is impossible without a backend, endpoint or DTO change AND later work depends on it (otherwise skip that fix,
  report it and continue);
- you cannot get a phase back to the baseline results after real attempts to fix it.

If the session ends or your context runs low, finish or revert the current file, then say which phase and step to resume
from. On resume, read `git log` and continue. Do not redo committed phases.

## B. Setup (once)

1. Read `REFACTOR_GUIDE_V3.md` completely. Read the contracts reference: `components/contracts/*`,
   `utils/ContractRole.js`, the contract wrappers, the contracts code in `components/api/Api.jsx`.
2. Check that `git status` is clean (ignore the guide and this prompt file; never commit them). Create and switch to the
   branch `refactor/feature-skeleton`.
3. Run the tests, build and linter with the scripts in `package.json`. Record the baseline, including existing failures.

## C. Loop for every phase

1. Read every file the phase affects, plus every importer (search tests and `vi.mock` paths too).
2. Post a short plan: old path -> new path, skeleton compliance (guide Part 1; give a reason for each row that does not
   apply), role permissions, which problem each change fixes. Then continue without waiting.
3. Implement. Move files with `git mv`. Write complete files.
4. Update every importer, `AppRoutes.jsx`, and any other integration point in guide 2.7 that applies.
5. Move tests with their files; change imports and mock paths only. Never delete, skip or weaken a test. If a listed bug
   fix truly requires an assertion change, make the smallest one and show before, after and the reason.
6. Run tests, build and linter. Fix every new failure before going on.
7. Search for old file names and import paths of this phase. No stale references may remain.
8. Check the changed files against guide Part 0 and 2.6.
9. Make one local commit: `refactor(phase N): <name>`. Do not push, merge, rebase or open a pull request.

## D. Rules for all phases

- No new dependencies. No backend, endpoint or DTO changes. `DevApi.jsx` stays unchanged.
- Keep routes, visuals, behaviour, props contracts, test ids and existing translation keys, except to fix a listed bug.
- Never edit the guide's "Never touch" files. `utils/Sort.jsx` and `HomeSections.js` may only be extended where a phase
  needs it.
- Contracts is the reference. Only change it where Phase 1 (shared components) or Phase 6 (wrapper paths) says so.
- No role name checks in shared feature code. Role configs hold data and pure rules, with no component imports.
- In every role config, wrap API functions: `fetchList: (...args) => apiFunction(...args)`. Do not assign imports
  directly, because some tests mock only part of `Api.jsx`. Paths must be getters because of the `AppRoutes` circular
  import. Define configs once at module level so hook dependencies stay stable.
- Use `useLoadedList` for list loading and polling. Patch from the returned DTO. If an endpoint returns no usable DTO,
  call `reload()` after success; never invent data.
- Actions return `{success, message?}`; errors are `{key, options?}`; reload on 409 or 404.
- Every new translation key goes in both fr and en.
- Keep one Api.jsx region per feature without changing names, signatures or URLs.
- Apply guide 2.6 to every new or changed file. No TODOs, placeholders or unused code.
- Never say something was run or verified if it was not.

---

## PHASE 1: Evaluations

The decisions below are approved.

### Files

Use `git mv` for moves.

| Old                                                                   | New                                                     |
|-----------------------------------------------------------------------|---------------------------------------------------------|
| (new)                                                                 | `utils/EvaluationRole.js`                               |
| `components/WorkplaceEvaluation/WorkplaceEvaluationList.jsx`          | `components/evaluations/EvaluationList.jsx`             |
| `components/WorkplaceEvaluation/WorkplaceEvaluationCard.jsx`          | `components/evaluations/EvaluationCard.jsx`             |
| `components/WorkplaceEvaluation/WorkplaceEvaluationForm.jsx`          | `components/evaluations/EvaluationForm.jsx`             |
| `components/WorkplaceEvaluation/WorkplaceEvaluationFile.jsx`          | `components/evaluations/EvaluationFile.jsx`             |
| (new)                                                                 | `components/evaluations/EvaluationActions.jsx`          |
| `components/WorkplaceEvaluation/SignEvaluationForm.jsx`               | delete, replaced by `components/documents/SignForm.jsx` |
| (new)                                                                 | `components/documents/PdfFilePage.jsx`                  |
| `components/page/teacher/WorkplaceEvaluations.jsx`                    | `components/page/teacher/Evaluations.jsx`               |
| `components/page/manager/WorkplaceEvaluation/WorkplaceEvaluation.jsx` | `components/page/manager/Evaluations.jsx`               |

Also change: `components/contracts/SignContractForm.jsx`, `components/contracts/ContractFile.jsx`,
`utils/WorkplaceEvaluation.js`, `routes/AppRoutes.jsx`, `components/home/HomeSections.js`, `utils/StatusColor.js`,
`components/api/Api.jsx`, both `translation.json` files.

### Role config: `utils/EvaluationRole.js`

Export `EVALUATION_ROLES` (TEACHER, MANAGER), `getEvaluationRole(user)` (strip `ROLE_`; unknown role falls back to
MANAGER) and the pure rules.

| Field                             | TEACHER                                                  | MANAGER                                                  |
|-----------------------------------|----------------------------------------------------------|----------------------------------------------------------|
| `can`                             | `fill`, `sign`, `openFile`                               | `openFile`                                               |
| `fetchList(sessionId)`            | `fetchWorkplaceEvaluations`                              | `fetchWorkplaceEvaluationsManager`                       |
| `fetchFile(id, language)`         | `getWorkplaceEvaluationFile`                             | `getWorkplaceEvaluationFileManager`                      |
| `save(id, payload)`               | `saveWorkplaceEvaluations`                               | none                                                     |
| `sign(id, signature)`             | `signWorkplaceEvaluation`                                | none                                                     |
| `devSign(id, email)`              | `devSignWorkplaceEvaluation`                             | none                                                     |
| `i18nPrefix`                      | `workplaceEvaluation`                                    | `workplaceEvaluation`                                    |
| `subtitleKey`                     | `workplaceEvaluation.subtitle`                           | `workplaceEvaluation.subtitlemanager`                    |
| `statusPage`                      | `teacherEvaluations`                                     | `managerEvaluations`                                     |
| `actionsKey`                      | `"teacher"`                                              | `null`                                                   |
| `basePath` / `filePath` (getters) | `PATHS.TEACHER_EVALUATIONS` / `PATHS.TEACHER_EVALUATION` | `PATHS.MANAGER_EVALUATIONS` / `PATHS.MANAGER_EVALUATION` |

Two traps:

- **API entries must be wrappers**, e.g. `fetchList: (sessionId) => fetchWorkplaceEvaluations(sessionId)`. Never assign
  the imported function directly. `AppRoutes` imports every page, and some tests mock only part of `Api.jsx`; reading a
  missing export while the module loads can break those tests.
- **Paths must be getters.** `AppRoutes` and the pages import each other, so `PATHS` must not be read at module load.

Define the objects once at module level so their functions are stable hook dependencies.

Pure rules in the same file:

- `EVALUATION_COLORS = [ALL, COLOR.YELLOW, COLOR.GREEN]`
- `evaluationColor(item)`: GREEN if `item.signedAt`, otherwise YELLOW. This is the only color rule, used by the filter,
  the card badge and Home.
- `isEvaluationComplete(form)` and `sortEvaluations(list)` (unsigned first, then newest by `updatedAt ?? createdAt`),
  keeping current behaviour.

In `utils/WorkplaceEvaluation.js`, remove `CONTRACT_ROLES` and `getEvaluationRole`. Keep the form helpers.

### Shared code in `components/evaluations/`

No role names and no `user.role` checks in this folder. Use `role.can` and `role.actionsKey`.

**EvaluationList** (`dark`, `user`)

- Get the role with `getEvaluationRole(user)` and the session with `useSession()`.
- `useLoadedList` with a `useCallback` fetcher that returns `null` while there is no session; complete dependencies.
- Keep `useColorFilter("status", EVALUATION_COLORS)` and the render ladder from guide 2.2. Pass `role.statusPage` to
  `StatusColorSelect`.
- Move the page header here from the wrappers, with the same markup and classes, using `role.subtitleKey`. Keep the same
  spacing.
- Save and sign return `{success: true}` or `{success: false, message: {key, options?}}` and never throw into the UI.
- Save failure message: `err.i18n ?? {key: "workplaceEvaluation.errors.submitFailed"}`.
- Sign failure message: keep `{key: "workplaceEvaluation.errors.signing"}`. Keep the completeness check before signing.
- On 409 or 404 from save or sign, `await reload()`.
- Save and sign endpoints return no usable DTO, so keep `await reload()` after success. Do not invent a response. Then
  call `refreshNotifications()`.
- Dev mode only swaps the API call.
- Remove the `console.log`, the loose `==` and the unused `answer`.

**EvaluationCard** (guide 2.3, props include `role` and `filterColor`)

- Keeps only UI state (editing, signing). Render the fill form only if `role.can.fill`, the sign form only if
  `role.can.sign`.
- Use `source.form ?? {}`, so `form: null` cannot crash the card.
- **Bug fix:** today the card closes the edit form even when saving fails. Await the result, close only on success, and
  return the result to the form. On failure, keep the typed values and show the error.
- Badge color comes from `evaluationColor`. A completed but unsigned badge becomes yellow; keep its "Completed" text.
  The three badge texts stay as they are.
- The filter border still appears only while a color filter is selected.
- If signed and `role.can.openFile`, show the open-file link using `evaluationFilePath(role.filePath, id)`, never a
  relative path. Keep `state={{studentName: evaluation.studentName}}`.

**EvaluationActions**

- One small teacher action bar (fill/edit, sign), selected by `role.actionsKey`; render nothing for `null`. Keep the
  current button tones, icons, labels and conditions. Respect `role.can`.

**EvaluationForm**

- Same fields, validation and payload. Store the submit error as `{key, options?}` and display it with
  `translateWarning`.

**EvaluationFile**

- Thin use of `PdfFilePage` with the role from `getEvaluationRole(user)`.
- **Bug fix:** preview AND download both use `role.fetchFile`. Today a manager's download calls the teacher endpoint.
- Remove the `useCloseShownNotifications(TARGET_TYPE.WORKPLACE_EVALUATION, ...)` call: that target type does not exist.
  Do not add one.

### Shared document components

Contracts must look and behave exactly as before. Keep `SignContractForm.jsx` and `ContractFile.jsx` as thin adapters
with the same names, exports and props. `ContractCard.jsx` stays unchanged.

**SignForm**: props `dark`, `devMode`, `onSubmit`, `onClose`, `i18nPrefix`, `fallbackErrorKey`.

- `i18nPrefix` is `managerContracts` or `workplaceEvaluation`; it reads the existing `${i18nPrefix}.sign.*` keys.
- `fallbackErrorKey` is `managerContracts.actionFailed` for contracts and `workplaceEvaluation.sign.errorFailed` for
  evaluations.
- Preserve validation order, disabled states, password clearing and the single error banner.
- The evaluation card uses `SignForm` directly.

**PdfFilePage**: take what differs as props: `dark`, document `id`, `backTo`, `titleKey`, `subtitleKey`, `backKey`,
`docType`, `studentName`, `fetchFile(id, language)`.

- Contracts: `managerContracts.file.title`, `.subtitle`, `.back`; docType `contract`.
- Evaluations: `workplaceEvaluation.title`, `workplaceEvaluation.file.subtitle`, `workplaceEvaluation.file.back`;
  docType `workplace-evaluation`.
- The language switch and download labels keep the existing `managerContracts.file.*` and `managerContracts.download.*`
  keys for both.
- `getUrl` uses `useCallback` with `[language, fetchFile]`; `fetchFile` must be stable.
- Keep language state, "download this", "download both", `busy` and `downloadFailed`.
- Notification closing stays in the `ContractFile` adapter, with its memoized id list.

### Wiring

**Wrappers**: copy the thin wrapper from guide Part 0 rule 6: outlet context, then
`<EvaluationList dark={dark} user={user}/>`. No state, effects or API calls.

**AppRoutes**: update imports, and add `evaluationFilePath(pattern, id)` using `generatePath`, next to
`contractFilePath`. Do not change paths, roles, nav or route order.

**HomeSections**: use one loader for both roles:

```js
const loadEvaluations = (role) => async ({sessionId}) =>
    asList(await role.fetchList(sessionId)).map(evaluationColor);
```

- Teacher card: same settings, now using this loader with `EVALUATION_ROLES.TEACHER`.
- New `PATHS.MANAGER_EVALUATIONS` card: icon `share_reviews`, page `managerEvaluations`, titleKey
  `home.managerEvaluationsLink`, param `status`, `scoped: true`, colors `PENDING_ONLY`, loader with
  `EVALUATION_ROLES.MANAGER`.
- Do NOT add it to `managerSpotlight`: managers cannot act on evaluations.

**StatusColor**: add `STATUS_LABEL_KEYS.managerEvaluations` with the same three keys as `teacherEvaluations`.

**Translations**: add `home.managerEvaluationsLink` to fr and en, matching the wording style of
`home.teacherEvaluationsLink`. Check that every key used by the evaluation and shared document code exists in both
files. List any missing key and add it to both.

**Api.jsx**: group all evaluation functions, manager ones included, in one `// region Workplace evaluations`. Do not
change names, signatures or URLs.

---

## PHASES 2 to 5: common instruction

For each phase, the matching section of guide Part 4 is the full list of required fixes. Fix **every** item. Before
moving code, read it and write down its current behaviour (filters, sort order, button conditions, confirmations,
errors, URL parameters, anchors, notifications). Keep all of it unless it is a listed bug. Report other bugs you find;
fix them only if the fix is small, inside the phase, and covered by a test or clearly described.

## PHASE 2: Interviews (`components/interviews/`)

- Create `InterviewList`, `InterviewCard`, `InterviewActions`, `InterviewPicker` and `utils/InterviewRole.js` (STUDENT,
  EMPLOYER). Wrappers: `page/student/Interviews.jsx`, `page/employer/Interviews.jsx`.
- Student: accept, reject with reason. Employer: edit through the picker, cancel.
- Replace manual loading and polling with `useLoadedList`; move inline filtering to pure functions; keep one
  `sortInterviews` in `utils/interviewStatus.js` (if the two copies differ, keep each role's current order through the
  role config); one `Intl` date formatter in `utils/`.
- Cancel needs a confirmation, a busy state that blocks double clicks, and a visible translated error. Reuse an existing
  confirmation pattern if there is one.
- Keep the `#interview-<id>` anchor and scroll behaviour used by `NotificationMenu`, including when data loads after
  navigation.
- `InterviewPicker` is also used by the applications code: find and update every importer.

## PHASE 3: Offers, Users, Tracking

- Offers: `OfferList`, `OfferCard`, `OfferActions`, `utils/OfferRole.js`, wrapper `page/student/Offers.jsx`. Keep the
  `#offer-<id>` anchor and scroll.
- Users: `UserList`, `UserCard`, `utils/UserRole.js`, wrapper `page/manager/Users.jsx`. No swallowed errors. A failed
  optimistic update must restore the previous state and show a translated error.
- Tracking: `components/tracking/TrackingList.jsx` reusing `UserCard`, wrapper `page/manager/Tracking.jsx`, and a light
  `utils/TrackingRole.js`.
- All three use `useLoadedList` with translated load and action errors.
- Give each feature its own Card and Actions only where the skeleton requires it; explain each row that does not apply.
  Do not rename translation keys.

## PHASE 4: Applications (`components/applications/`)

- Create `ApplicationList` (grouped by internship), `InternshipApplicationList` (one internship plus hire selection),
  `ApplicationCard`, `utils/ApplicationRole.js`, `utils/useApplicationPreview.js`. Wrappers:
  `page/employer/Applications.jsx`, `page/employer/ApplicationsOfInternship.jsx`.
- One hook for the New badge, preview, `getUrl` and `handleApplicationSeen`. Keep `utils/useNewApplications.js`
  behaviour.
- Stop fetching interviews once per card. Load them once in the list using existing endpoints only (for example the
  employer interviews list, if its data can be matched reliably to applications). Verify the fields in the code. Refresh
  after an interview is created or changed. If no existing endpoint can do it, keep the current behaviour and report the
  backend need.
- The single internship page must call `getApplications(sessionId)` with the selected session before filtering by
  internship id. Check that links to another session still behave sensibly.
- Hire selection must survive polling, and drop ids that are no longer selectable.

## PHASE 5: Internships (`components/internships/`)

This is the largest phase. First list every current behaviour for employer, manager and student, then implement, then
check the list item by item.

- Create `InternshipList`, `InternshipCard`, `InternshipForm`, `InternshipFilters`, `InternshipActions`,
  `ApplyControls`, `SentDocuments`, `utils/InternshipRole.js` (fetchers, `can` flags, status ranks, audience). Wrappers
  for employer, manager and student.
- Employer: create, edit, delete, view applications. Manager: approve, reject, edit. Student: apply, update CV.
- `canEdit`, `canDelete`, locks and `canChangeOffers` become pure rules, with the same results as today.
- Replace the two employer pollings, the five student loaders and the manual manager load with `useLoadedList`. Related
  data may be combined in one stable fetcher; do not let a failure of optional data block the whole page if it does not
  today.
- Student view tracking must still send each internship as viewed only as often as today. Polling must not cause
  repeated calls.
- Polling must not reset an open form, filters or selected documents.
- After internships move, update every older importer (applications included).

## PHASE 6: Pure moves (no logic change)

- `page/manager/CvReviewList.jsx` -> `components/cvs/CvReviewList.jsx`; `page/manager/Cv.jsx` -> `page/manager/Cvs.jsx`.
- `page/portfolio/*` -> `components/portfolio/*`; wrapper `page/student/Portfolio.jsx`.
- `page/manager/StudentStatus*` -> `components/student-statuses/*`, mock included (still mock data); wrapper
  `page/manager/StudentStatuses.jsx`. Update the `HomeSections.js` mock import.
- `page/employer/contracts/Contracts.jsx` -> `page/employer/Contracts.jsx`; same for student.
- Only paths, imports and the minimum split needed for a thin wrapper. **No logic or behaviour change**, even if you
  find a bug: report it. The guide's moves-only rule wins over cleanup conventions in this phase. Do not add role logic
  here; report any missing skeleton rows.

---

## E. Final check (after Phase 6)

1. Run the full tests, build and linter again and compare with the baseline.
2. Compare the `src/` tree with guide Part 3. Explain every difference. Delete old files and empty folders.
3. Check that no shared feature code compares role names, no wrapper has state, effects, API calls or filtering, no page
   file contains a card, and changed files have no `console.log`. Report legacy cases outside the refactor.
4. Check fr and en have matching keys and that every new or dynamically built key exists.
5. Check every route in `AppRoutes.jsx` imports an existing file, and every route with `home` has a Home card.
6. Review the diff from the starting commit for unintended behaviour or visual changes.

## F. Final report

- Per phase: commit hash, files created, moved, changed, deleted
- Bugs fixed, and anything skipped with the reason
- Decisions you made where something was unclear
- Real test, build and lint results compared with the baseline
- Test assertion changes, if any
- fr + en keys added; backend needs
- Things you could not verify
- Manual browser checklist for each role (student, employer, manager, teacher), including contract signing and download
- Self-check against guide Part 0, Part 1 and 2.6: pass or fail