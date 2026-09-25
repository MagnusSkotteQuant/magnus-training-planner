# Validation report — 25 September 2026

## Result

**29 automated tests passed: 10 model tests and 19 DOM integration tests.** JavaScript syntax checks also passed. CSS parsed successfully in the DOM test environment. No runtime errors were captured in the exercised DOM workflows.

These are Node.js/jsdom tests, not a claim of a completed real-browser visual review. The available cloud browser blocked local file preview under its URL policy. GitHub was signed out. Consequently, the site was not uploaded/deployed, and real browser interactions, responsive appearance, physical dragging and print pagination remain unverified.

## Tested automatically

| Area | Coverage |
|---|---|
| Initial page | Actual index.html and scripts load in jsdom; seven days, recovery sessions, totals, notes and commitments render |
| Calendar | All 66 weeks navigate; previous/next, date picker, week picker, Current week, range boundaries |
| ISO dates | Every day from 28 Sep 2026 to 2 Jan 2028 checked against Python's independent ISO calendar; New Year W53/W1 |
| Schedule | Exact old/new commitment times in 12–18 October; commitments never draggable |
| Templates | Recovery details; all normal workouts; exact totals; no default time conflicts for any week |
| Add/edit | All fields, duration, distance, time, type, intensity, gym focus, details, comments and day changes |
| Delete | Confirmation and cancellation paths |
| Drag/drop | Synthetic drag events move the session, highlight the target, preserve time and refresh ordering/totals |
| Independence | Editing one week does not change others; copies do not share workout objects |
| Weekly note | Saves per week and survives reconstructed page/reload |
| Copy weeks | Previous and next; overwrite confirmation/cancel; copying saved edits/notes |
| Reset/clear | Current week only; reset restores badge/template; clear preserves note and commitments |
| Persistence | Actual localStorage serialization and a fresh DOM load from stored data |
| Week link | Compressed UTF-8/Unicode snapshot round-trip; draft isolation; explicit save; return/discard |
| Full-plan link | Multiple independent weeks and implicit defaults round-trip |
| Sharing fallback | Clipboard failure/manual copy; non-compressed links; 8,000-character limit |
| JSON | Actual Blob export; import validation/confirmation; merge keeps unrelated weeks; invalid JSON rejected |
| Input handling | Invalid dates/types/times/distances, duplicate IDs, overnight workouts, malformed shared data |
| HTML safety | Workout names/details/comments render as escaped text, not executable markup |
| Storage failure | Corrupt stored data is left untouched; unavailable storage shows a warning |
| Print wiring | Print action calls print; details/comments/note are populated for print |
| Mobile fallback | Day selector moves sessions without dragging |
| Static assets | All required files referenced; no remote scripts, CSS, fetch calls, WebSockets or backend |

## Not visually verified

- Desktop spacing/readability and seven-column appearance.
- Mobile layout, touch targets, keyboard/dialog behavior on an actual phone.
- Native HTML drag behavior and drop highlight under a physical mouse/touchpad.
- Native clipboard permission prompts and download dialogs.
- Print/PDF pagination and browser-specific page-breaking.
- Rendering from a live GitHub Pages address.

Responsive styles exist at 1,150, 800 and 480 px; print uses an A4 landscape stylesheet. Their presence and CSS parsing were checked; layout was not measured by a rendering engine.

## Quick check after publishing

1. Open the Pages link. See recovery Week 40 and the note; move to Week 41.
2. Add a session, edit its time, drag it to another day, and refresh. It should remain.
3. Copy a week link into a second browser window. Confirm it opens as a shared draft, without overwriting local weeks.
4. Export JSON, change a week, then import after reading the overwrite confirmation.
5. Try the planner on your phone and open Print / PDF on desktop.

These remaining checks are recorded because the execution environment prevented completing them here, not because they have already passed.
