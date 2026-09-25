/* Pure planner model. No network, UI or browser storage dependencies. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Planner = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FIRST = '2026-09-28', LAST = '2027-12-27', VERSION = 1;
  const TYPES = ['Run', 'Bike', 'Gym'];
  const INTENSITIES = ['Recovery', 'Easy/Z2', 'Steady', 'Threshold', 'VO2/Hard', 'Strength'];
  const FOCUSES = ['', 'Upper', 'Full Body', 'Lower'];
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  function date(s) { return new Date(s + 'T12:00:00Z'); }
  function key(d) { return d.toISOString().slice(0, 10); }
  function add(s, n) { const d = date(s); d.setUTCDate(d.getUTCDate() + n); return key(d); }
  function monday(s) { const d = date(s); return add(s, -((d.getUTCDay() + 6) % 7)); }
  function validDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(date(s)) && key(date(s)) === s; }
  function inRange(s) { return validDate(s) && s >= FIRST && s <= LAST && monday(s) === s; }
  function isoWeek(s) {
    const d = date(s); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const year = d.getUTCFullYear();
    return { year, week: Math.ceil((((d - new Date(Date.UTC(year, 0, 1, 12))) / 86400000) + 1) / 7) };
  }
  function weeks() { const a = []; for (let s = FIRST; s <= LAST; s = add(s, 7)) a.push(s); return a; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function minutes(t) { return Number(t.slice(0, 2)) * 60 + Number(t.slice(3)); }
  function duration(n) { return (Math.floor(n / 60) ? Math.floor(n / 60) + 'h' : '') + (n % 60 ? (n >= 60 ? ' ' : '') + (n % 60) + 'm' : '') || '0m'; }
  function commitments(s) {
    const day = (date(s).getUTCDay() + 6) % 7, old = s < '2026-10-15';
    const uni = (start, end, details) => [{ name: 'University + commute', start, end, details }];
    const work = () => [{ name: 'Work', start: '09:00', end: '16:00', details: 'Great Dane · fixed commitment' }];
    if (day === 0) return old ? uni('08:00', '18:00', 'Classes 10–12 & 14–16 · 2h travel each way') : uni('12:00', '18:00', 'Class 14–16 · 2h travel each way');
    if (day === 1) return old ? work() : [];
    if (day === 2) return uni('06:00', '12:00', 'Class 08–10 · 2h travel each way');
    if (day === 3) return old ? uni('12:00', '18:00', 'Class 14–16 · 2h travel each way') : work();
    return day === 4 ? work() : [];
  }
  function defaultWeek(s) {
    if (!inRange(s)) throw Error('Week is outside the planner range.');
    const list = [];
    function w(day, type, name, time, duration, distance, intensity, focus, details) {
      list.push({ id: s + '-' + list.length, day, type, name, time, duration, distance, intensity, focus, details, comments: '' });
    }
    if (s === FIRST) {
      w(2, 'Bike', 'Very easy bike', '17:30', 35, null, 'Recovery', '', 'Very easy spinning. All training is optional; skip if soreness or fatigue remains.');
      w(3, 'Run', 'Optional easy run', '08:00', 30, 5, 'Recovery', '', 'Only if legs feel normal. Approximately 5 km maximum; no pace target.');
      w(4, 'Gym', 'Easy upper body', '17:00', 50, null, 'Strength', 'Upper', '45–50 min, easy/moderate upper body only. No lower-body work.');
      w(5, 'Bike', 'Easy recovery ride', '09:00', 60, null, 'Recovery', '', '45–60 min easy cycling. Shorten or skip if needed.');
      w(6, 'Run', 'Optional easy run', '09:00', 55, 9, 'Recovery', '', '45–60 min; 8–10 km maximum, only if recovered.');
      return { workouts: list, note: 'Post-marathon recovery week. Prioritize recovery; all training is optional and should be reduced/skipped if soreness or fatigue remains.', customized: false };
    }
    const earlyMon = s < '2026-10-15';
    w(0, 'Gym', 'Upper A', earlyMon ? '18:30' : '08:00', 60, null, 'Strength', 'Upper', 'Main horizontal press + vertical pull. Complementary upper-body work. Mostly 1–3 reps from failure.');
    w(0, 'Run', 'Easy run + strides', earlyMon ? '06:00' : '09:30', 50, 9, 'Easy/Z2', '', '8–9 km easy. Optional 4–6 × 15–20 sec relaxed strides, with easy recovery.');
    w(1, 'Bike', 'Aerobic bike', add(s, 1) < '2026-10-15' ? '17:30' : '09:00', 85, null, 'Easy/Z2', '', '75–90 min. Comfortable cadence. Build cycling tolerance before adding hard bike work.');
    w(2, 'Run', 'Easy / medium run', '13:00', 65, 12, 'Easy/Z2', '', '11–12 km easy. Can gradually become slightly longer.');
    w(2, 'Gym', 'Upper B', '17:00', 60, null, 'Strength', 'Upper', 'A different press/pull emphasis from Monday. Controlled reps and comfortable recovery.');
    w(3, 'Run', 'Threshold with friend', '06:30', 70, 13, 'Threshold', '', 'Key run. 20 min warm-up, 3 × 10 min threshold with 2 min easy jog between reps, 16 min cooldown.');
    w(4, 'Gym', 'Full Body', '17:00', 60, null, 'Strength', 'Full Body', 'Upper-body biased: 60–70% upper / 30–40% lower. Main upper press/pull, one squat or leg-press pattern, one hinge or hamstring movement, and calves. Roughly 4–6 hard lower-body sets TOTAL, including calves. Avoid grinding/failure.');
    w(4, 'Bike', 'Recovery spin', '18:15', 45, null, 'Recovery', '', 'Extremely easy. First session to remove if fatigue becomes high.');
    w(5, 'Bike', 'Long aerobic ride', '09:00', 135, null, 'Easy/Z2', '', 'Initially 2h15–2h30; build toward 2.5–3 hours. Practice fueling.');
    w(5, 'Run', 'Short brick run', '11:20', 20, 4, 'Easy/Z2', '', 'Easy run off the bike. No pace target.');
    w(6, 'Run', 'Long run', '09:00', 95, 18, 'Easy/Z2', '', '90–100 min easy, around 18 km initially. Later HM-specific work may be added.');
    return { workouts: list, note: 'Default template for use once recovered. Adjust volume and intensity with your coach; this is not an automatic progression.', customized: false };
  }
  function getWeek(state, s) { return clone(state.weeks[s] || defaultWeek(s)); }
  function summary(w) {
    return w.workouts.reduce((a, x) => {
      a.sessions++; a.total += x.duration;
      if (x.type === 'Run') a.run += x.distance || 0;
      if (x.type === 'Bike') a.bike += x.duration;
      if (x.type === 'Gym' && x.focus === 'Upper') a.upper++;
      if (x.type === 'Gym' && x.focus === 'Full Body') a.full++;
      return a;
    }, { run: 0, bike: 0, upper: 0, full: 0, sessions: 0, total: 0 });
  }
  function overlaps(s, w, all) {
    const start = minutes(w.time), end = start + w.duration;
    return commitments(add(s, w.day)).some(c => start < minutes(c.end) && end > minutes(c.start)) || all.some(c => c.id !== w.id && c.day === w.day && start < minutes(c.time) + c.duration && end > minutes(c.time));
  }
  function str(o, k, max, blank = true) { if (typeof o[k] !== 'string' || o[k].length > max || (!blank && !o[k].trim())) throw Error('Invalid ' + k + '.'); return o[k]; }
  function validateWorkout(x) {
    if (!x || typeof x !== 'object') throw Error('Invalid workout.');
    if (!Number.isInteger(x.day) || x.day < 0 || x.day > 6) throw Error('Invalid workout day.');
    if (!TYPES.includes(x.type) || !INTENSITIES.includes(x.intensity) || !FOCUSES.includes(x.focus)) throw Error('Invalid workout category.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)) throw Error('Invalid start time.');
    if (!Number.isInteger(x.duration) || x.duration < 1 || x.duration > 1440 || minutes(x.time) + x.duration > 1440) throw Error('Workout must finish by midnight.');
    if (x.distance !== null && (!Number.isFinite(x.distance) || x.distance < 0 || x.distance > 2000)) throw Error('Invalid distance.');
    return { id: str(x, 'id', 100, false), day: x.day, type: x.type, name: str(x, 'name', 120, false), time: x.time, duration: x.duration, distance: x.distance, intensity: x.intensity, focus: x.focus, details: str(x, 'details', 12000), comments: str(x, 'comments', 12000) };
  }
  function validateState(input) {
    if (!input || input.app !== 'magnus-training-planner' || input.version !== VERSION || !input.weeks || typeof input.weeks !== 'object' || Array.isArray(input.weeks) || !inRange(input.selected)) throw Error('This is not a supported Magnus training plan (version 1).');
    const result = empty(input.selected);
    if (Object.keys(input.weeks).length > weeks().length) throw Error('Too many weeks.');
    for (const [s, w] of Object.entries(input.weeks)) {
      if (!inRange(s) || !w || !Array.isArray(w.workouts) || w.workouts.length > 100) throw Error('Invalid week or too many workouts.');
      const workouts = w.workouts.map(validateWorkout);
      if (new Set(workouts.map(x => x.id)).size !== workouts.length) throw Error('Duplicate workout IDs.');
      result.weeks[s] = { workouts, note: str(w, 'note', 20000), customized: Boolean(w.customized) };
    }
    return result;
  }
  function empty(selected = FIRST) { return { app: 'magnus-training-planner', version: VERSION, selected, weeks: {} }; }
  function copyWeek(state, from, to) {
    const w = getWeek(state, from); w.customized = true;
    w.workouts.forEach((x, i) => { x.id = to + '-copy-' + i; });
    state.weeks[to] = w;
  }
  return { FIRST, LAST, VERSION, TYPES, INTENSITIES, FOCUSES, DAYS, date, key, add, monday, validDate, inRange, isoWeek, weeks, clone, minutes, duration, commitments, defaultWeek, getWeek, summary, overlaps, validateWorkout, validateState, empty, copyWeek };
});
