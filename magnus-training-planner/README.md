# Magnus training planner

A standalone, static HTML/CSS/JavaScript planner. No account, backend, build process, paid API, external scripts, external fonts, or Lovable dependency.

## Publish on GitHub Pages

1. Extract `magnus-training-planner.zip` on your computer.
2. Open https://github.com/MagnusSkotteQuant/magnus-training-planner and sign in to your GitHub account.
3. The repository was empty when checked. Click **uploading an existing file** in its Quick setup area. Once it contains files, use **Add file → Upload files**.
4. Upload these FOUR files from the extracted folder, directly to the repository root:
   - `index.html`
   - `styles.css`
   - `core.js`
   - `app.js`
5. Click **Commit changes** to the **main** branch. Do not upload the ZIP itself or put `index.html` inside another folder.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, choose **Source: Deploy from a branch**.
8. Select **Branch: main** and **Folder: / (root)**, then **Save**.
9. Wait for the Pages deployment to finish. Settings → Pages will show the actual **Visit site** link. Use that link to open the planner.

Expected address after deployment: `https://magnusskottequant.github.io/magnus-training-planner/`. This address has not been verified live; deployment was not performed because the available browser was signed out of GitHub.

GitHub's official publishing instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

The remaining documentation and `tests/` are optional developer files and do not need uploading. The four website files also work on another static host without a build step. Keep all four together.

## Use it

- **Weeks:** previous/next, Current week, date picker, or week list. All 66 weeks are independent. The last week starts 27 December 2027 and ends 2 January 2028.
- **Edit:** click a workout, fill in its fields, and save. Add workouts from each day. Deletion asks first.
- **Move:** drag the dotted handle on desktop. On a phone, change **Day** in the editor. Start time stays the same. Sessions are displayed in time order.
- **Manage week:** copy previous/next, reset, or clear workouts. Only the chosen week is changed; clearing workouts keeps its coach note.
- **Totals:** running kilometres, cycling minutes, upper/full-body sessions, session count, and total training duration update immediately. Optional sessions count until removed.
- **Notes:** the weekly note autosaves as you type; each session has separate prescription and coach comment fields.
- **Overlaps:** a small schedule-overlap label appears when sessions clash with commitments or one another. It does not stop you from saving.
- **Print / PDF:** opens your browser's print dialog. Choose Save as PDF to make a PDF. The print stylesheet uses A4 landscape and includes session details/comments plus the weekly note. Long content may use extra pages. Print layout has not been visually verified in this environment.

## Saving and coach collaboration

Workout edits happen entirely inside the planner. **You do not reupload GitHub files to change your workouts.** GitHub needs new files only when changing features or design.

Data saves automatically in this browser's localStorage, under `magnus-training-planner:v1`, keyed by Monday date. Data does not sync automatically across devices, browsers, or people. Private-browsing sessions and cleared browser data can lose local plans. Export JSON backups regularly. Local `file://` storage can vary by browser; use the deployed HTTPS site for daily use. Data entered in a local copy is separate from the deployed site's data; move it with JSON export/import.

**Coach workflow:**

1. Open **Share & backup → Copy this week link**, or **Copy full plan link**.
2. Send the resulting link to your coach yourself.
3. They open the exact snapshot, make changes, and copy a fresh link to send back.
4. Open that link, review it, and choose **Save to this device** to merge those weeks into your saved plan after confirmation.

A shared link opens separately from local weeks. Edits in a shared draft stay in memory until you save it or create a fresh link/export; reloading the original link reloads the original snapshot. **Return to my plan** discards the draft after confirmation. Links are snapshots, not a live collaborative document. Anyone who receives a link can read the encoded plan; there is no password or encryption.

Shared plans use the URL fragment and never contact a backend. Modern browsers compress the JSON using built-in gzip. If clipboard access is unavailable, a manual-copy field appears. Links above 8,000 characters are rejected in favour of JSON. When opened locally, generated links target the expected GitHub Pages address and will only work after that site is published. On a hosted site, links use that site's current URL.

**Export plan JSON** contains all saved/changed weeks and the versioned default template reference for untouched weeks. An untouched week is reconstructed from the bundled version-1 template; exports and full-plan links need not repeat 66 identical templates. **Import plan JSON** merges its explicit weeks after confirmation and leaves other weeks alone. It is not a destructive whole-browser replacement. Reset weeks are saved explicitly, so a reset can be shared too.

Invalid or oversized imports are rejected before saving. An export can be opened as text for inspection. Do not manually change its `version` field. This release accepts version 1 only. The JSON import size limit is 2.5 MB; a week supports up to 100 sessions.

## Templates and commitments

- 28 September 2026 uses the requested optional post-marathon recovery week.
- Subsequent untouched weeks use the requested normal template, with a note to use it once recovered. There is no automatic training progression or recovery assessment.
- The normal template is 56 km running, 4h25 cycling, two upper-body sessions and one full-body session: 11 sessions and 12h25 total. Distances and durations are editable planning estimates.
- Fixed work/university commitments are computed from each actual date in `core.js`, separately from workout data. Monday–Wednesday of 12–18 October use the old schedule; Thursday onward uses the new one.
- The supplied university/work pattern continues through the whole date range, including holidays. No holidays or semester breaks were specified. To change that assumption later, edit `commitments()` in `core.js`; saved training weeks are unaffected.
- Run is green, bike blue, gym purple, and fixed commitments grey. There is no football or Sunday gym by default.

## Files and testing

- `index.html`: structure, controls and dialogs.
- `styles.css`: desktop/mobile styles and print layout.
- `core.js`: dates, templates, commitments, totals and validation.
- `app.js`: editing, drag/drop, local saving, sharing and imports.
- `TEST_REPORT.md`: exact automated coverage and remaining visual checks.
- `tests/`: reproducible automated tests; not required to run or host the app.

For development only: install Node.js and Python 3, then run `npm --prefix tests install` followed by `npm --prefix tests test` from this folder. Tests use jsdom (development only); the live website has zero npm dependencies.
