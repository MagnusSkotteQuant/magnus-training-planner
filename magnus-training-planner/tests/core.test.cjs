const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../core.js');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
test('66 complete Monday–Sunday weeks including 2 Jan 2028',()=>{
 const list=P.weeks();assert.equal(list.length,66);assert.equal(list[0],'2026-09-28');assert.equal(list.at(-1),'2027-12-27');assert.equal(P.add(P.LAST,6),'2028-01-02');
 for(const s of list){assert.equal(P.date(s).getUTCDay(),1);for(let i=0;i<7;i++)assert.equal(P.monday(P.add(s,i)),s);}
 assert.equal(P.inRange('2026-09-21'),false);assert.equal(P.inRange('2028-01-03'),false);
});
test('ISO weeks match Python independent oracle for every date',()=>{
 const expected=JSON.parse(execFileSync('python3',['-c',`import datetime,json\nd=datetime.date(2026,9,28)\nr={}\nwhile d<=datetime.date(2028,1,2):\n y,w,_=d.isocalendar();r[d.isoformat()]={'year':y,'week':w};d+=datetime.timedelta(days=1)\nprint(json.dumps(r))`],{encoding:'utf8'}));
 for(const [d,value]of Object.entries(expected))assert.deepEqual(P.isoWeek(d),value,d);
 assert.deepEqual(P.isoWeek('2027-01-01'),{year:2026,week:53});assert.deepEqual(P.isoWeek('2027-01-04'),{year:2027,week:1});
});
test('October transition uses each actual date',()=>{
 const expected=[['2026-10-12','08:00','18:00'],['2026-10-13','09:00','16:00'],['2026-10-14','06:00','12:00'],['2026-10-15','09:00','16:00'],['2026-10-16','09:00','16:00']];
 for(const [d,start,end]of expected){const c=P.commitments(d);assert.equal(c.length,1);assert.equal(c[0].start,start);assert.equal(c[0].end,end);}
 assert.equal(P.commitments('2026-10-15')[0].name,'Work');assert.equal(P.commitments('2026-10-08')[0].name,'University + commute');
 assert.equal(P.commitments('2026-10-19')[0].start,'12:00');assert.deepEqual(P.commitments('2026-10-20'),[]);
});
test('recovery week prescriptions and exact summary',()=>{
 const w=P.defaultWeek(P.FIRST);assert.equal(w.workouts.length,5);assert.ok(w.workouts.every(x=>x.day>=2));assert.ok(w.note.startsWith('Post-marathon recovery week.'));
 assert.deepEqual(P.summary(w),{run:14,bike:95,upper:1,full:0,sessions:5,total:230});
 assert.ok(w.workouts.filter(x=>x.type==='Run').every(x=>x.name.includes('Optional')));assert.match(w.workouts.find(x=>x.type==='Gym').details,/No lower-body/);
});
test('normal template has requested sessions, no football or Sunday gym',()=>{
 const w=P.defaultWeek('2026-10-05');assert.deepEqual(P.summary(w),{run:56,bike:265,upper:2,full:1,sessions:11,total:745});
 assert.equal(w.workouts.find(x=>x.day===3).intensity,'Threshold');assert.equal(w.workouts.filter(x=>x.type==='Gym'&&x.day===6).length,0);
 assert.match(w.workouts.find(x=>x.focus==='Full Body').details,/4–6 hard lower-body sets TOTAL/);
});
test('every default validates and fits commitments across all 66 weeks',()=>{
 for(const s of P.weeks()){const w=P.defaultWeek(s);for(const x of w.workouts){assert.doesNotThrow(()=>P.validateWorkout(x));assert.equal(P.overlaps(s,x,w.workouts),false,s+' '+x.name);}const state=P.empty(s);state.weeks[s]=w;assert.deepEqual(P.validateState(state),state);}
});
test('edits and copies do not alias another week',()=>{
 const s=P.empty('2026-10-05');const a=P.getWeek(s,s.selected);a.workouts[0].name='Changed';a.note='Coach A';s.weeks[s.selected]=a;
 assert.equal(P.getWeek(s,'2026-10-12').workouts[0].name,'Upper A');
 P.copyWeek(s,'2026-10-05','2026-10-12');s.weeks['2026-10-12'].workouts[0].name='Other';s.weeks['2026-10-12'].note='Coach B';
 assert.equal(s.weeks['2026-10-05'].workouts[0].name,'Changed');assert.equal(s.weeks['2026-10-05'].note,'Coach A');
 assert.notEqual(s.weeks['2026-10-05'].workouts[0].id,s.weeks['2026-10-12'].workouts[0].id);
});
test('overlap warnings detect conflicts but not touching boundaries',()=>{
 const w=P.defaultWeek('2026-10-05'),x=w.workouts[0];x.time='17:45';assert.equal(P.overlaps('2026-10-05',x,w.workouts),true);x.time='18:00';assert.equal(P.overlaps('2026-10-05',x,w.workouts),false);
 x.time='06:00';assert.equal(P.overlaps('2026-10-05',x,w.workouts),true);
});
test('invalid imports fail instead of corrupting state',()=>{
 const base=P.empty();base.weeks[P.FIRST]=P.defaultWeek(P.FIRST);
 const bad=[s=>s.version=2,s=>s.selected='2026-09-29',s=>s.weeks.__proto__={bad:true},s=>s.weeks[P.FIRST].workouts[0].duration=-1,s=>s.weeks[P.FIRST].workouts[0].time='25:00',s=>s.weeks[P.FIRST].workouts[0].day=7,s=>s.weeks[P.FIRST].workouts[0].distance=-1,s=>s.weeks[P.FIRST].workouts[0].details=null,s=>s.weeks[P.FIRST].workouts[0].type='Swim',s=>s.weeks[P.FIRST].workouts.push(s.weeks[P.FIRST].workouts[0])];
 bad.splice(2,1);for(const mutate of bad){const s=P.clone(base);mutate(s);assert.throws(()=>P.validateState(s));}
 assert.equal(P.validDate('2026-02-30'),false);assert.equal(P.validDate('abc'),false);
});
test('source is fully static and references existing assets',()=>{
 const html=fs.readFileSync('index.html','utf8');for(const name of ['styles.css','core.js','app.js'])assert.ok(html.includes(name));assert.ok(!/https?:\/\/[^"']+\.(js|css)/.test(html));
 for(const file of ['core.js','app.js']){const source=fs.readFileSync(''+file,'utf8');assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(source));}
});
